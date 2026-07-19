import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  room: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;
}
