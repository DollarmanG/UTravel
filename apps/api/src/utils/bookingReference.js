function generateBookingReference(existingReferences = new Set()) {
  let reference = "";

  do {
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6 siffror
    reference = `UT${randomNumber}`;
  } while (existingReferences.has(reference));

  return reference;
}

module.exports = {
  generateBookingReference,
};