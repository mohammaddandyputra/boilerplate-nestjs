import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseDTO } from 'src/common/dto';
import { UsersService } from 'src/users/users.service';
import { LoginDTO, RegisterDTO } from './dto';
import * as bcrypt from 'bcrypt';
import * as JWT from 'jsonwebtoken';
import * as _ from 'lodash';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({
    summary: 'Auth Login',
  })
  @ApiOkResponse({ description: 'The request has succeeded' })
  @ApiBadRequestResponse({ description: 'The request was invalid' })
  @ApiNotFoundResponse({ description: 'The request was not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('login')
  async login(@Body() body: LoginDTO): Promise<ResponseDTO> {
    const { email, password } = body;
    const user = await this.usersService.get({ where: { email } }, [
      'withoutTimestamp',
      'withRole',
    ]);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const match: boolean = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new BadRequestException('Password incorrect!');
    }

    const userData = _.omit(user.dataValues, ['password', 'status']);
    const token = JWT.sign(userData, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE_IN,
    });

    return {
      statusCode: HttpStatus.OK,
      data: { user: userData, token },
    };
  }

  @ApiOperation({
    summary: 'Auth Register',
  })
  @ApiOkResponse({ description: 'The request has succeeded' })
  @ApiBadRequestResponse({ description: 'The request was invalid' })
  @ApiNotFoundResponse({ description: 'The request was not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('/register')
  async register(@Body() body: RegisterDTO): Promise<ResponseDTO> {
    const data = await this.usersService.create(
      {
        ...body,
      },
      ['withoutPassword', 'withRole', 'withoutTimestamp'],
    );

    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
