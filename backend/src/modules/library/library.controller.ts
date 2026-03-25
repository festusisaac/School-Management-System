import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Patch,
  Delete,
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
import { CreateAuthorDto, UpdateAuthorDto } from './dtos/author.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dtos/category.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // Authors
  @Post('authors')
  @ApiOperation({ summary: 'Create a new author' })
  createAuthor(@Body() dto: CreateAuthorDto, @Request() req: any) {
    return this.libraryService.createAuthor(dto, req.user.tenantId);
  }

  @Get('authors')
  @ApiOperation({ summary: 'List all authors' })
  findAuthors(@Request() req: any) {
    return this.libraryService.findAllAuthors(req.user.tenantId);
  }

  @Patch('authors/:id')
  @ApiOperation({ summary: 'Update an author' })
  updateAuthor(@Param('id') id: string, @Body() dto: UpdateAuthorDto, @Request() req: any) {
    return this.libraryService.updateAuthor(id, dto, req.user.tenantId);
  }

  @Delete('authors/:id')
  @ApiOperation({ summary: 'Delete an author' })
  deleteAuthor(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.deleteAuthor(id, req.user.tenantId);
  }

  // Categories
  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  createCategory(@Body() dto: CreateCategoryDto, @Request() req: any) {
    return this.libraryService.createCategory(dto, req.user.tenantId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  findCategories(@Request() req: any) {
    return this.libraryService.findAllCategories(req.user.tenantId);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Request() req: any) {
    return this.libraryService.updateCategory(id, dto, req.user.tenantId);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  deleteCategory(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.deleteCategory(id, req.user.tenantId);
  }

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

  @Patch('books/:id')
  @ApiOperation({ summary: 'Update book details' })
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
  updateBook(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: UpdateBookDto, @Request() req: any) {
    const coverPath = file ? `uploads/books/${file.filename}` : undefined;
    return this.libraryService.updateBook(id, dto, req.user.tenantId, coverPath);
  }

  @Delete('books/:id')
  @ApiOperation({ summary: 'Delete a book' })
  deleteBook(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.deleteBook(id, req.user.tenantId);
  }

  @Post('books/:id/copies')
  @ApiOperation({ summary: 'Create a copy of a book' })
  createCopy(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.libraryService.createCopy(id, req.user.tenantId, body.barcode, body.location);
  }

  @Patch('copies/:id')
  @ApiOperation({ summary: 'Update a book copy' })
  updateCopy(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.libraryService.updateCopy(id, req.user.tenantId, body.barcode, body.location, body.status);
  }

  @Delete('copies/:id')
  @ApiOperation({ summary: 'Delete a book copy' })
  deleteCopy(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.deleteCopy(id, req.user.tenantId);
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

  @Get('stats')
  @ApiOperation({ summary: 'Get library dashboard statistics' })
  getStats(@Request() req: any) {
    return this.libraryService.getStats(req.user.tenantId);
  }
}
