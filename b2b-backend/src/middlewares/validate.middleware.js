export const validate = (schema) => (req, res, next) => {
  // 🔥 Pre-processing: Convert common stringified values from FormData to proper types
  console.log('--- VALIDATION START ---');
  console.log('Headers Content-Type:', req.headers['content-type']);
  console.log('Original Body Keys:', Object.keys(req.body || {}));
  console.log('Original Body Values:', JSON.stringify(req.body));
  console.log('File Present:', !!req.file);

  if (req.body) {
    Object.keys(req.body).forEach(key => {
      // Convert 'true'/'false' strings to Booleans
      if (req.body[key] === 'true') req.body[key] = true;
      if (req.body[key] === 'false') req.body[key] = false;
      
      // Convert numeric strings to Numbers if they look like numbers and aren't IDs
      const val = req.body[key];
      if (typeof val === 'string' && val.trim() !== '' && !isNaN(val)) {
        // Skip IDs (24-char hex strings or anything with 'id' in the key)
        const isId = key.toLowerCase().includes('id') || (val.length === 24 && /^[0-9a-fA-F]+$/.test(val));
        if (!isId) {
          req.body[key] = Number(val);
        }
      }
    });
    console.log('Processed Body:', JSON.stringify(req.body));
  }

  const { error, value } = schema.validate(
    {
      body: req.body,
      query: req.query,
      params: req.params,
    },
    { abortEarly: false, allowUnknown: true, stripUnknown: false }
  );

  if (error) {
    console.error('❌ Validation Failed:', error.details.map(d => d.message));
    return res.status(400).json({
      success: false,
      message: error.details.map((err) => err.message).join(', '),
      details: error.details
    });
  }

  // 🔥 Update req with validated/transformed values
  req.body = value.body;
  req.query = value.query;
  req.params = value.params;

  next();
};