const orderModel = require("../model/orderModel")
const cartModel = require("../model/cartModel")
const userModel = require("../model/userModel")

const {isValidName,isValidEmail,isValidObjectId,isValidString,isValidAvailableSizes,
    isValidFile,isValidNumbers,isValidPhone,isValidPrice,isValidPassword,isValidPincode,
  } = require("../validation/validator");
const productModel = require("../model/productModel");


 const createOrder = async function (req, res) {
    try {
      let userId = req.params.userId;
      let data = req.body;
      let cartId = data.cartId;
      let productId = data.productId
  
      if(Object.keys(data).length == 0)
        return res.status(400).send({status: false,message: "Please provide data in request body"});
  
      if (!isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "Please provide valid User Id" });
      let findUser = await userModel.findOne({ _id: userId });
      if (!findUser)
        return res.status(404).send({ status: false, message: "not found userId" });
  
      if (!cartId)
        return res.status(400).send({ status: false, message: "cartId is required" });
      if (!isValidObjectId(cartId))
        return res.status(400).send({ status: false, message: "Please provide valid cart Id" });
  
      let findCart = await cartModel.findOne({ _id: cartId });
      if (!findCart)
        return res.status(404).send({ status: false, message: "not found cartId" });
      if (findCart.userId != userId)
        return res.status(403).send({status: false,message: "you are not allow to create this order"});
  
      let obj = {
        userId: userId,
        items: findCart.items,
        totalPrice: findCart.totalPrice,
        totalItems: findCart.totalItems,
        totalQuantity: findCart.totalQuantity,
        status: "pending",
        cancellable: true,
      };
  
      let count = 0;
      let items = findCart.items;
      for (let i = 0; i < items.length; i++) {
        count += items[i].quantity;
      }
  
      obj["totalQuantity"] = count;
  
      let finalData = await orderModel.create(obj);
  
      const updateOrder = await cartModel.findOneAndUpdate({ userId },
        { $set: { items: [], totalItems: 0, totalPrice: 0 } },
        { new: true }
      );
  
      return res.status(201).send({ status: true, message: "Success", data: finalData,updateOrder});
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };


  /**********************************update order  ****************/
  const updateOrder = async function(req,res){
    try {
      let userId = req.params.userId
      let data = req.body
      let {status ,orderId } = data

      if(Object.keys(data).length == 0) return res.status(400).send({status: false,message: "Please provide data in request body"});

      // const user = await userModel.findOne({ _id : userId})
      // if(!user) return res.status(404).send({status : false , message :  "user not found"})

      const findOrder = await orderModel.findOne({ _id : orderId, isDeleted : false})
      if(!findOrder) return res.status(404).send({status : false , message :  "order not found"})

      if(userId != findOrder.userId) return res.status(403).send({status : false ,message : "user is not authorised user"})

      let statuslist =  ["pending", "completed", "canceled"]
      if(!statuslist.includes(status)) return res.status(400).send({status : false , message : "status must be pending or completed or canceled"});

      const order = await orderModel.findOneAndUpdate(
        {_id : orderId , isDeleted : false , cancellable : true},
        data,
        {new : true}
      )

      if(!order) return res.status(404).send({status : false , message :  "order not found"})

      return res.status(200).send({status : true , message :" Order Updated Successfully ",data : order})

      
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
      
    }
  }

  module.exports ={createOrder ,updateOrder}