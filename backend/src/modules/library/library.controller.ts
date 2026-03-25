import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LibraryService } from './library.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { IssueLoanDto } from './dtos/issue-loan.dto';
import { ReturnLoanDto } from './dtos/return-loan.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  @ApiOperation({ summary: 'Create a new book (multipart/form-data with optional cover)' })
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: './uploads/books',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  createBook(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateBookDto, @Request() req: any) {
    const coverPath = file ? `uploads/books/${file.filename}` : undefined;
    return this.libraryService.createBook(dto, req.user.tenantId, coverPath);
  }

  @Get('books')
  @ApiOperation({ summary: 'List books with optional search' })
  findBooks(@Query() query: any, @Request() req: any) {
    return this.libraryService.findAllBooks(query, req.user.tenantId);
  }

  @Get('books/:id')
  @ApiOperation({ summary: 'Get book details by id' })
  getBook(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.findOneBook(id, req.user.tenantId);
  }

  @Post('books/:id/copies')
  @ApiOperation({ summary: 'Create a copy of a book' })
  createCopy(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.libraryService.createCopy(id, req.user.tenantId, body.barcode, body.location);
  }

  @Post('loans')
  @ApiOperation({ summary: 'Issue a loan for a book copy' })
  issueLoan(@Body() dto: IssueLoanDto, @Request() req: any) {
    return this.libraryService.issueLoan(dto, req.user.tenantId);
  }

  @Post('loans/return')
  @ApiOperation({ summary: 'Return a loaned copy' })
  returnLoan(@Body() dto: ReturnLoanDto, @Request() req: any) {
    return this.libraryService.returnLoan(dto, req.user.tenantId);
  }

  @Get('loans/overdue')
  @ApiOperation({ summary: 'List overdue loans' })
  getOverdues(@Request() req: any) {
    return this.libraryService.findOverdues(req.user.tenantId);
  }
}
