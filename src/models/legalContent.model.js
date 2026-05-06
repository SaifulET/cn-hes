import mongoose from "mongoose";

const LEGAL_CONTENT_TYPES = ["aboutus", "privacy-policy", "terms-condition"];

const legalContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: LEGAL_CONTENT_TYPES,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const LegalContent = mongoose.model("LegalContent", legalContentSchema);

export { LEGAL_CONTENT_TYPES };
export default LegalContent;
