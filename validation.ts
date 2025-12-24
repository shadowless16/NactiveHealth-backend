import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    next();
  };
};

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const patientSchema = Joi.object({
  full_name: Joi.string().required(),
  date_of_birth: Joi.date().iso().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  phone: Joi.string().allow('', null)
});

export const encounterSchema = Joi.object({
  patient_id: Joi.number().required(),
  clinician_role: Joi.string().required(),
  notes: Joi.string().allow('', null)
});

export const prescriptionSchema = Joi.object({
  encounter_id: Joi.number().required(),
  drug_name: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  duration: Joi.string().required()
});
