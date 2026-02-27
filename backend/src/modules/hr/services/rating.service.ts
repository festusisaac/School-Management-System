import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherRating } from '../entities/teacher-rating.entity';
import { CreateTeacherRatingDto, UpdateTeacherRatingDto } from '../dto/teacher-rating.dto';

@Injectable()
export class RatingService {
    constructor(
        @InjectRepository(TeacherRating)
        private readonly ratingRepository: Repository<TeacherRating>,
    ) { }

    async findAll(): Promise<TeacherRating[]> {
        return this.ratingRepository.find({
            relations: ['teacher', 'rater'],
            order: { ratingDate: 'DESC' },
        });
    }

    async findOne(id: string): Promise<TeacherRating> {
        const rating = await this.ratingRepository.findOne({
            where: { id },
            relations: ['teacher', 'rater'],
        });

        if (!rating) {
            throw new NotFoundException(`Teacher rating with ID ${id} not found`);
        }

        return rating;
    }

    async create(createDto: CreateTeacherRatingDto, raterId: string): Promise<TeacherRating> {
        const overallRating = this.calculateOverallRating(createDto);

        const rating = this.ratingRepository.create({
            ...createDto,
            ratedBy: raterId,
            overallRating,
        });

        return this.ratingRepository.save(rating);
    }

    async update(id: string, updateDto: UpdateTeacherRatingDto): Promise<TeacherRating> {
        const rating = await this.findOne(id);

        const updatedData = { ...rating, ...updateDto };

        // Recalculate overall rating if evaluation criteria are updated
        const overallRating = this.calculateOverallRating(updatedData as CreateTeacherRatingDto);

        Object.assign(rating, { ...updateDto, overallRating });

        return this.ratingRepository.save(rating);
    }

    async remove(id: string): Promise<void> {
        const rating = await this.findOne(id);
        await this.ratingRepository.remove(rating);
    }

    private calculateOverallRating(dto: CreateTeacherRatingDto): number {
        const scores = [
            dto.teachingSkills,
            dto.classroomManagement,
            dto.studentEngagement,
            dto.punctuality,
            dto.subjectKnowledge,
            dto.communication,
        ];

        const total = scores.reduce((acc, score) => acc + score, 0);
        return parseFloat((total / scores.length).toFixed(2));
    }

    async getTeacherRatings(teacherId: string): Promise<TeacherRating[]> {
        return this.ratingRepository.find({
            where: { teacherId },
            relations: ['rater'],
            order: { ratingDate: 'DESC' },
        });
    }

    async getAverageRating(teacherId: string): Promise<number> {
        const ratings = await this.ratingRepository.find({
            where: { teacherId },
        });

        if (ratings.length === 0) return 0;

        const total = ratings.reduce((acc, r) => acc + Number(r.overallRating), 0);
        return parseFloat((total / ratings.length).toFixed(2));
    }
}
