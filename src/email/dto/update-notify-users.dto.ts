import { PartialType } from "@nestjs/swagger";
import { NotifyUsersDto } from "./notify-users.dto";

export class UpdateNotifyUsersDto extends PartialType(NotifyUsersDto) {}