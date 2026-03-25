import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { Book } from './entities/book.entity';
import { Author } from './entities/author.entity';
import { Category } from './entities/category.entity';
import { BookCopy } from './entities/book-copy.entity';
import { Loan } from './entities/loan.entity';
import { Fine } from './entities/fine.entity';
import { LibrarySetting } from './entities/library-setting.entity';
import { LibrarySettingsService } from './library-settings.service';
import { LibrarySettingsController } from './library-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Author, Category, BookCopy, Loan, Fine, LibrarySetting]),
  ],
  controllers: [LibraryController, LibrarySettingsController],
  providers: [LibraryService, LibrarySettingsService],
  exports: [LibraryService, LibrarySettingsService, TypeOrmModule],
})
export class LibraryModule {}
