import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RatingService } from '../services/rating.service';
import { TeacherRating } from '../entities/teacher-rating.entity';
import { NotFoundException } from '@nestjs/common';

describe('RatingService', () => {
  let service: RatingService;

  const mockRatingRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        { provide: getRepositoryToken(TeacherRating), useValue: mockRatingRepository },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return ratings with optional filters', async () => {
      mockRatingRepository.find.mockResolvedValueOnce([{ id: 'rating_1' }]);
      const result = await service.findAll({ academicYear: '2023', term: 'First' });
      expect(result).toHaveLength(1);
      expect(mockRatingRepository.find).toHaveBeenCalledWith({
        where: { academicYear: '2023', term: 'First' },
        relations: ['teacher', 'rater'],
        order: { ratingDate: 'DESC' }
      });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      mockRatingRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should return rating if found', async () => {
      mockRatingRepository.findOne.mockResolvedValueOnce({ id: 'rating_1' });
      const result = await service.findOne('rating_1');
      expect(result.id).toBe('rating_1');
    });
  });

  describe('create', () => {
    it('should calculate overall rating and save', async () => {
      mockRatingRepository.create.mockImplementationOnce(val => val);
      mockRatingRepository.save.mockImplementationOnce(val => Promise.resolve({ ...val, id: 'rating_1' }));

      const result = await service.create({
        teachingSkills: 4,
        classroomManagement: 4,
        studentEngagement: 5,
        punctuality: 5,
        subjectKnowledge: 4,
        communication: 5
      } as any, 'rater_1');

      // Total = 27, count = 6, average = 4.5
      expect(result.overallRating).toBe(4.5);
      expect(result.ratedBy).toBe('rater_1');
    });
  });

  describe('update', () => {
    it('should recalculate overall rating and update', async () => {
      const existing = {
        id: 'rating_1',
        teachingSkills: 2,
        classroomManagement: 2,
        studentEngagement: 2,
        punctuality: 2,
        subjectKnowledge: 2,
        communication: 2,
        overallRating: 2
      };
      
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existing as any);
      mockRatingRepository.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.update('rating_1', {
        teachingSkills: 4,
        classroomManagement: 4,
        studentEngagement: 4,
        punctuality: 4,
        subjectKnowledge: 4,
        communication: 4
      } as any);

      expect(result.overallRating).toBe(4);
    });
  });

  describe('remove', () => {
    it('should remove rating', async () => {
      const rating = { id: 'rating_1' };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(rating as any);
      
      await service.remove('rating_1');
      expect(mockRatingRepository.remove).toHaveBeenCalledWith(rating);
    });
  });

  describe('getTeacherRatings', () => {
    it('should return ratings for a teacher', async () => {
      mockRatingRepository.find.mockResolvedValueOnce([{ id: 'rating_1' }]);
      const result = await service.getTeacherRatings('teacher_1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAverageRating', () => {
    it('should return 0 if no ratings', async () => {
      mockRatingRepository.find.mockResolvedValueOnce([]);
      const result = await service.getAverageRating('teacher_1');
      expect(result).toBe(0);
    });

    it('should return average of overall ratings', async () => {
      mockRatingRepository.find.mockResolvedValueOnce([
        { overallRating: '4.5' },
        { overallRating: '3.5' }
      ]);
      const result = await service.getAverageRating('teacher_1');
      expect(result).toBe(4);
    });
  });
});
