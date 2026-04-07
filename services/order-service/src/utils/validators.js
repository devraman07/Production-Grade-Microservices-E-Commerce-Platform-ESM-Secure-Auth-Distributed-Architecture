import Joi from 'joi';

const createOrderSchema = Joi.object({
  items: Joi.array().min(1).required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().allow(''),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India'),
    phone: Joi.string().min(10).required()
  }).required(),
  paymentMethod: Joi.string().valid('card', 'cod', 'wallet').required(),
  notes: Joi.string().allow('')
});

const validateOrder = (data) => {
  return createOrderSchema.validate(data);
};

export { validateOrder };
