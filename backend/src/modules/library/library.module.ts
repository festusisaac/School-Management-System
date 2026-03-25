import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryController } from '@modules/library/library.controller';
import { LibraryService } from '@modules/library/library.service';
import { Book } from '@modules/library/entities/book.entity';
import { Author } from '@modules/library/entities/author.entity';
import { Category } from '@modules/library/entities/category.entity';
import { BookCopy } from '@modules/library/entities/book-copy.entity';
import { Loan } from '@modules/library/entities/loan.entity';
import { Fine } from '@modules/library/entities/fine.entity';
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
