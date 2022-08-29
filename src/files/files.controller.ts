import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileMimeTypeValidationPipe } from './pipes/file-validation.pipe';
import { CreateFileDto } from './dto/create-file.dto';
import { RequiredPermissions } from '../shared/decorators/required-permissions.decorator';
import { permissions } from '../shared/constants/permissions.constant';
import {
  i18nValidationErrorFactory,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';
import { File } from './entities/file.entity';
import { FilesServiceToken } from '../shared/di.tokens';
import { IFilesService } from './interfaces/files-service.interface';
import { NotFoundExceptionFilter } from '../shared/exceptions/not-found-exception.filter';
import { ObjectIdValidationPipe } from '../shared/pipes/object-id-validation.pipe';
import { PayloadTooLargeExceptionFilter } from './exceptions/payload-too-large.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { MongooseClassSerializerInterceptor } from '../shared/interceptors/mongoose-class-serializer.interceptor';
import { MongoExceptionFilter } from '../shared/exceptions/mongo-exception.filter';
import { realpathSync } from 'fs';
import { HasFileValidationPipe } from './pipes/has-file-validation.pipe';
import { BadRequestExceptionFilter } from '../shared/exceptions/bad-request-exception.filter';
import { UnauthorizedExceptionFilter } from '../shared/exceptions/unauthorized-exception.filter';
import { ForbiddenExceptionFilter } from '../shared/exceptions/forbidden-exception.filter';

@Controller('files')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(MongooseClassSerializerInterceptor(File))
@UseFilters(
  MongoExceptionFilter,
  UnauthorizedExceptionFilter,
  ForbiddenExceptionFilter,
)
export class FilesController {
  constructor(
    @Inject(FilesServiceToken)
    private readonly filesService: IFilesService<
      File,
      CreateFileDto,
      UpdateFileDto
    >,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @RequiredPermissions(permissions.files.create)
  @UsePipes(
    new ValidationPipe({ exceptionFactory: i18nValidationErrorFactory }),
  )
  @UseFilters(
    PayloadTooLargeExceptionFilter,
    BadRequestExceptionFilter,
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  )
  async create(
    @UploadedFile(HasFileValidationPipe, FileMimeTypeValidationPipe)
    file: Express.Multer.File,
    @Body() createFileDto: CreateFileDto,
    @Req() req,
  ): Promise<File> {
    return await this.filesService.create({
      name: createFileDto.name,
      path: realpathSync(file.path, { encoding: 'utf-8' }),
      createdBy: req.user,
      updatedBy: req.user,
    } as CreateFileDto);
  }

  @Get()
  @RequiredPermissions(permissions.files.read)
  async findAll(): Promise<File[]> {
    return await this.filesService.findAll();
  }

  @Get(':id')
  @RequiredPermissions(permissions.files.read)
  @UseFilters(NotFoundExceptionFilter)
  async findOneById(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<File> {
    return await this.filesService.findOneById(id);
  }

  @Patch(':id')
  @RequiredPermissions(permissions.files.update)
  @UseFilters(NotFoundExceptionFilter)
  async update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateFileDto: UpdateFileDto,
  ): Promise<File> {
    return await this.filesService.update(id, updateFileDto);
  }

  @Delete(':id')
  @RequiredPermissions(permissions.files.delete)
  @UseFilters(NotFoundExceptionFilter)
  async remove(@Param('id', ObjectIdValidationPipe) id: string): Promise<File> {
    return await this.filesService.remove(id);
  }
}
