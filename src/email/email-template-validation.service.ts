/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import {
  EmailTemplateDataSchema,
  validateEmailTemplateData,
} from './email-template-data.schema';

export interface EmailTemplateValidationInput {
  subjectTemplate?: string;
  htmlTemplate?: string;
  textTemplate?: string | null;
  variables?: Record<string, unknown>;
  dataSchema?: EmailTemplateDataSchema;
}

export interface EmailTemplateValidationIssue {
  field: 'subjectTemplate' | 'htmlTemplate' | 'textTemplate' | 'variables';
  message: string;
}

export interface EmailTemplateValidationResult {
  valid: boolean;
  errors: EmailTemplateValidationIssue[];
  warnings: EmailTemplateValidationIssue[];
}

@Injectable()
export class EmailTemplateValidationService {
  /**
   * Built-in Handlebars block helpers whose names are not variables.
   */
  private readonly blockHelpers = new Set(['if', 'unless', 'each', 'with']);
  private readonly inlineHelpers = new Set(['lookup', 'log']);

  validate(input: EmailTemplateValidationInput): EmailTemplateValidationResult {
    const errors: EmailTemplateValidationIssue[] = [];
    const warnings: EmailTemplateValidationIssue[] = [];

    if (!input.subjectTemplate?.trim()) {
      errors.push({
        field: 'subjectTemplate',
        message: 'Subject template cannot be empty.',
      });
    }

    if (!input.htmlTemplate?.trim()) {
      errors.push({
        field: 'htmlTemplate',
        message: 'HTML template cannot be empty.',
      });
    }

    const declaredVariables = input.variables ?? {};

    if (
      !declaredVariables ||
      typeof declaredVariables !== 'object' ||
      Array.isArray(declaredVariables)
    ) {
      errors.push({
        field: 'variables',
        message:
          'Variables must be an object containing declared variable names.',
      });
    }

    // Stop execution early if base structural configurations are critically missing
    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    const fields: Array<{
      field: 'subjectTemplate' | 'htmlTemplate' | 'textTemplate';
      source: string | null | undefined;
    }> = [
      { field: 'subjectTemplate', source: input.subjectTemplate },
      { field: 'htmlTemplate', source: input.htmlTemplate },
      { field: 'textTemplate', source: input.textTemplate },
    ];

    for (const { field, source } of fields) {
      if (!source?.trim()) {
        if (field === 'textTemplate') continue;
        continue;
      }

      let ast: any;
      try {
        ast = Handlebars.parse(source);
      } catch (error) {
        errors.push({
          field,
          message: `Invalid Handlebars syntax: ${this.getErrorMessage(error)}`,
        });
        continue;
      }

      this.validateAst(ast, field, declaredVariables, errors, input.dataSchema);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateData(
    dataSchema: EmailTemplateDataSchema,
    data: Record<string, unknown>,
  ) {
    return validateEmailTemplateData(dataSchema, data);
  }

  private validateAst(
    ast: any,
    field: EmailTemplateValidationIssue['field'],
    declaredVariables: Record<string, unknown>,
    errors: EmailTemplateValidationIssue[],
    dataSchema?: EmailTemplateDataSchema,
  ): void {
    const walk = (node: any, insideEach: boolean): void => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const child of node) {
          walk(child, insideEach);
        }
        return;
      }

      if (node.type === 'BlockStatement') {
        const helperName = this.getPathName(node.path);

        // 1. Validate the helper block's properties out-of-context FIRST
        // Example: For {{#each shifts}}, validate 'shifts' against the root scope.
        for (const param of node.params ?? []) {
          this.inspectExpression(
            param,
            insideEach,
            field,
            declaredVariables,
            errors,
          );
        }

        const nextInsideEach = insideEach || helperName === 'each';

        if (helperName === 'each' && dataSchema) {
          this.validateEachBlockFields(node, field, dataSchema, errors);
        }

        if (this.blockHelpers.has(helperName)) {
          if (node.hash) {
            walk(node.hash, nextInsideEach);
          }
          walk(node.program, nextInsideEach);
          walk(node.inverse, nextInsideEach);
          return;
        }

        // Custom block helper
        this.checkPath(node.path, insideEach, field, declaredVariables, errors);

        if (node.hash) {
          walk(node.hash, insideEach);
        }
        walk(node.program, insideEach);
        walk(node.inverse, insideEach);
        return;
      }

      if (node.type === 'MustacheStatement') {
        const helperName = this.getPathName(node.path);

        if (!this.inlineHelpers.has(helperName)) {
          this.checkPath(
            node.path,
            insideEach,
            field,
            declaredVariables,
            errors,
          );
        }

        for (const param of node.params ?? []) {
          this.inspectExpression(
            param,
            insideEach,
            field,
            declaredVariables,
            errors,
          );
        }

        walk(node.hash, insideEach);
        return;
      }

      if (
        node.type === 'ContentStatement' ||
        node.type === 'CommentStatement' ||
        node.type === 'StringLiteral' ||
        node.type === 'NumberLiteral' ||
        node.type === 'BooleanLiteral' ||
        node.type === 'UndefinedLiteral' ||
        node.type === 'NullLiteral'
      ) {
        return;
      }

      for (const value of Object.values(node as Record<string, unknown>)) {
        if (value && typeof value === 'object') {
          walk(value, insideEach);
        }
      }
    };

    walk(ast, false);
  }

  private validateEachBlockFields(
    node: any,
    field: EmailTemplateValidationIssue['field'],
    dataSchema: EmailTemplateDataSchema,
    errors: EmailTemplateValidationIssue[],
  ): void {
    const collection: unknown = node.params?.[0];
    const collectionName = this.getPathName(collection);
    const itemFields = dataSchema.fields[collectionName]?.items;

    if (!itemFields) return;

    const walk = (child: any): void => {
      if (!child || typeof child !== 'object') return;
      if (Array.isArray(child)) {
        child.forEach(walk);
        return;
      }

      if (child.type === 'BlockStatement' && child !== node) {
        // Nested blocks establish their own scope and are validated separately.
        return;
      }

      if (child.type === 'MustacheStatement') {
        this.validateEachPath(
          child.path,
          field,
          collectionName,
          itemFields,
          errors,
        );
        for (const param of child.params ?? []) {
          this.validateEachPath(
            param,
            field,
            collectionName,
            itemFields,
            errors,
          );
        }
      }

      for (const value of Object.values(child as Record<string, unknown>)) {
        if (value && typeof value === 'object') walk(value);
      }
    };

    walk(node.program);
  }

  private validateEachPath(
    path: any,
    field: EmailTemplateValidationIssue['field'],
    collectionName: string,
    itemFields: Record<string, unknown>,
    errors: EmailTemplateValidationIssue[],
  ): void {
    if (!path || path.type !== 'PathExpression') return;

    const original = String(path.original ?? '').trim();
    if (
      !original ||
      original === '.' ||
      original === 'this' ||
      original.startsWith('@') ||
      original.startsWith('../') ||
      this.inlineHelpers.has(original)
    ) {
      return;
    }

    const fieldName = original.split(/[.[\]]/)[0];
    if (!(fieldName in itemFields)) {
      errors.push({
        field,
        message: `Variable "${fieldName}" is not declared for items in "${collectionName}".`,
      });
    }
  }

  private inspectExpression(
    expression: any,
    insideEach: boolean,
    field: EmailTemplateValidationIssue['field'],
    declaredVariables: Record<string, unknown>,
    errors: EmailTemplateValidationIssue[],
  ): void {
    if (!expression || typeof expression !== 'object') return;

    if (expression.type === 'PathExpression') {
      this.checkPath(expression, insideEach, field, declaredVariables, errors);
      return;
    }

    if (expression.type === 'SubExpression') {
      const helperName = this.getPathName(expression.path);

      if (!this.inlineHelpers.has(helperName)) {
        this.checkPath(
          expression.path,
          insideEach,
          field,
          declaredVariables,
          errors,
        );
      }

      for (const param of expression.params ?? []) {
        this.inspectExpression(
          param,
          insideEach,
          field,
          declaredVariables,
          errors,
        );
      }

      if (expression.hash) {
        this.inspectExpression(
          expression.hash,
          insideEach,
          field,
          declaredVariables,
          errors,
        );
      }
      return;
    }

    if (Array.isArray(expression)) {
      for (const item of expression) {
        this.inspectExpression(
          item,
          insideEach,
          field,
          declaredVariables,
          errors,
        );
      }
      return;
    }

    for (const value of Object.values(expression as Record<string, unknown>)) {
      if (value && typeof value === 'object') {
        this.inspectExpression(
          value,
          insideEach,
          field,
          declaredVariables,
          errors,
        );
      }
    }
  }

  private checkPath(
    path: any,
    insideEach: boolean,
    field: EmailTemplateValidationIssue['field'],
    declaredVariables: Record<string, unknown>,
    errors: EmailTemplateValidationIssue[],
  ): void {
    if (!path || path.type !== 'PathExpression') return;

    const original = String(path.original ?? '').trim();

    if (!original || original === '.' || original === 'this') return;

    // Handle @index, @key, @first, @last etc.
    if (original.startsWith('@')) {
      if (original.startsWith('@root.')) {
        const rootName = original.slice('@root.'.length).split(/[.[\]]/)[0];
        this.checkDeclaredVariable(rootName, field, declaredVariables, errors);
      }
      return;
    }

    // Explicit parent path access via ../
    if (original.startsWith('../')) {
      const rootName = original.replace(/^(?:\.\.\/)+/, '').split(/[.[\]]/)[0];
      this.checkDeclaredVariable(rootName, field, declaredVariables, errors);
      return;
    }

    // 2. Clear out the insideEach blocker logic:
    // If inside an `each` loop, assume implicit scope property (like date, startTime).
    // If NOT inside an `each` block, validate it cleanly against root declarations.
    if (insideEach) {
      return;
    }

    const rootName = original.split(/[.[\]]/)[0];
    this.checkDeclaredVariable(rootName, field, declaredVariables, errors);
  }

  private checkDeclaredVariable(
    variableName: string,
    field: EmailTemplateValidationIssue['field'],
    declaredVariables: Record<string, unknown>,
    errors: EmailTemplateValidationIssue[],
  ): void {
    if (!(variableName in declaredVariables)) {
      errors.push({
        field,
        message: `Variable "${variableName}" is not declared in the template schema.`,
      });
    }
  }

  /**
   * Helper utility to extract string keys from Handlebars Path Expressions
   */
  private getPathName(path: any): string {
    if (!path || path.type !== 'PathExpression') return '';
    return String(path.original ?? '').trim();
  }

  /**
   * Safe parser handling string exception conversions
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
