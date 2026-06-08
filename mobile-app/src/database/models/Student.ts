import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, relation } from '@nozbe/watermelondb/decorators';
import type Class from './Class';
import type Section from './Section';

export default class Student extends Model {
  static table = 'students';

  @text('tenant_id') tenantId!: string;
  @text('admission_no') admissionNo!: string;
  @text('roll_no') rollNo?: string;
  @text('first_name') firstName!: string;
  @text('last_name') lastName?: string;
  @text('middle_name') middleName?: string;
  @text('gender') gender!: string;
  @date('dob') dob!: Date;
  @text('mobile_number') mobileNumber?: string;
  @text('email') email?: string;
  @field('class_id') classId?: string;
  @field('section_id') sectionId?: string;
  @text('parent_id') parentId?: string;
  @field('is_active') isActive!: boolean;
  @text('student_photo') studentPhoto?: string;
  
  // Additional fields from backend
  @text('religion') religion?: string;
  @text('caste') caste?: string;
  @text('father_email') fatherEmail?: string;
  @text('mother_email') motherEmail?: string;
  @date('admission_date') admissionDate?: Date;
  @text('blood_group') bloodGroup?: string;
  @text('genotype') genotype?: string;
  @text('state_of_origin') stateOfOrigin?: string;
  @text('nationality') nationality?: string;
  @text('height') height?: string;
  @text('weight') weight?: string;
  @date('as_on_date') asOnDate?: Date;
  @field('category_id') categoryId?: string;
  @field('house_id') houseId?: string;
  @field('user_id') userId?: string;
  @text('father_name') fatherName?: string;
  @text('father_phone') fatherPhone?: string;
  @text('father_occupation') fatherOccupation?: string;
  @text('mother_name') motherName?: string;
  @text('mother_phone') motherPhone?: string;
  @text('mother_occupation') motherOccupation?: string;
  @text('guardian_name') guardianName?: string;
  @text('guardian_relation') guardianRelation?: string;
  @text('guardian_phone') guardianPhone?: string;
  @text('guardian_email') guardianEmail?: string;
  @text('guardian_photo') guardianPhoto?: string;
  @text('guardian_address') guardianAddress?: string;
  @text('emergency_contact') emergencyContact?: string;
  @text('current_address') currentAddress?: string;
  @text('permanent_address') permanentAddress?: string;
  @text('transport_route') transportRoute?: string;
  @text('vehicle_number') vehicleNumber?: string;
  @text('pickup_point') pickupPoint?: string;
  @text('hostel_name') hostelName?: string;
  @text('room_number') roomNumber?: string;
  @text('medical_conditions') medicalConditions?: string;
  @text('previous_school_name') previousSchoolName?: string;
  @text('last_class_passed') lastClassPassed?: string;
  @text('special_physical_health_problems') specialPhysicalHealthProblems?: string;
  @field('has_disability') hasDisability?: boolean;
  @field('has_allergies') hasAllergies?: boolean;
  @text('allergy_details') allergyDetails?: string;
  @text('family_doctor_name') familyDoctorName?: string;
  @text('family_doctor_clinic_address') familyDoctorClinicAddress?: string;
  @text('family_doctor_phone') familyDoctorPhone?: string;
  @field('first_aid_consent') firstAidConsent?: boolean;
  @field('catholic_faith_consent') catholicFaithConsent?: boolean;
  @field('is_baptized') isBaptized?: boolean;
  @field('is_communicant') isCommunicant?: boolean;
  @text('application_fee_reference') applicationFeeReference?: string;
  @field('undertaking_accepted') undertakingAccepted?: boolean;
  @field('parent_signature') parentSignature?: boolean;
  @date('deactivated_at') deactivatedAt?: Date;
  @field('deactivate_reason_id') deactivateReasonId?: string;
  @field('discount_profile_id') discountProfileId?: string;

  @relation('classes', 'class_id') class!: Class;
  @relation('sections', 'section_id') section!: Section;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
