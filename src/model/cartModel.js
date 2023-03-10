const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema(
  {
    userId: {type: ObjectId,ref: "User",
    },
    items: [{
      _id: {id:false},
        productId: {
          type: ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { 
          type: Number, 
          required: true,
          default : 1
           },
      },],
    totalPrice: {
      type: Number,
      required: true,
    },
    totalItems: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model("Cart", cartSchema);