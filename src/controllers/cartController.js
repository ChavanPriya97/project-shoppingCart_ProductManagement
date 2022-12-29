const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const aws = require("../aws/aws");
const {isValidObjectId, isValidString, isValidNumbers} = require("../validation/validator");


//================ create cart ============================================

const createCart = async function(req,res){
  try {
      let data = req.body
      let userId = req.params.userId
      let {productId,quantity,cartId} = data 

      if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "Request body cannot remain empty" });

     
      
      if(!userId) return res.status(400).send({status : false , message : "please  provide userId "})
      if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: `${userId} is invalid` });

      const user = await userModel.findOne({userId})
      if(!user) return res.status(404).send({status : false , message : "user not found "})

      if(!productId) return res.status(400).send({status : false , message : "please  provide productId "})
      if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: `${productId} is invalid` });
      
      if (quantity) {
        if (!isValidNumbers(quantity)) {
            return res.status(400).send({ status: false, message: "Quantity is not Valid" })
        }
      }else{
        quantity = 1
      }

      const product = await productModel.findOne({ _id : productId , isDeleted : false})
      let totalPrice = product.price * quantity

      if(!product) return res.status(404).send({status : false , message : "product not found "})

      let cartFind = await cartModel.findOne({ userId : userId })
      
      if(!cartFind) {
          let items = [ {
              productId: productId,
              quantity: quantity
            }]
          let totalItems = items.length

          const cart = await cartModel.create({
                  userId : userId,
                  items:items,
                  totalPrice : totalPrice,
                  totalItems : totalItems})
          
          return res.status(201).send({status : true , message : "Success",data : cart})    
      }
      else{
         // cart find and product id find in cart
          if(!cartId) return res.status(400).send({status : false , message : "cartID is required"})
          
          if(!(cartFind._id == cartId)) return res.status(400).send({status : false , message : "cartID not match"})

          let cartItems = cartFind.items
          for(let i =0;i<cartItems.length;i++){  // we are checking that the product that we are sending from request body is exist in our items of cart model 
              if( productId == cartItems[i].productId){ // the client is suggesting us for decrementation of one quantity of the product from the cart

                cartItems[i].quantity = (cartItems [i].quantity)+quantity
                
                let items = cartItems 
                let totalPrice = (cartFind.totalPrice) + (quantity * (product.price))
     
                let cart= await cartModel.findOneAndUpdate(
                  {userId : userId},
                  {$set : {items : items , totalPrice : totalPrice}},
                  {new:true})
                
                return res.status(201).send({status:true,message:"Success",data:cart})
              } 
          }
         // cart find but product id not find in cart

          let items = [ {
              productId: productId,
              quantity: quantity
            }]
            
          let totalItems = items.length
          
          const cart = await cartModel.findOneAndUpdate(
              {userId : userId },
              {
                  $push : {items : items},
                  $inc : {totalPrice : totalPrice , totalItems : totalItems},
              },
              {new :true}
              )
  
          return res.status(201).send({status : true , message : "Success",data : cart})        
      }

  } catch (error) {
      return res.status(500).send({status : false , message : error.message})
      
  }
};
//================ update cart ============================================
const updateCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    const data = req.body;
    let { cartId, productId, removeProduct } = data;

    if (!isValidObjectId(userId)) 
      return res.status(400).send({ status: false, message: `${userId} is invalid` });

    const findUser = await userModel.findById({ _id: userId });

    if (!findUser) 
      return res.status(404).send({ status: false, message: "User does not exist" });

    if (Object.keys(data).length==0) 
      return res.status(400).send({ status: false, message: "Request body cannot remain empty" });

    if (!productId)
      return res.status(400).send({ status: false, message: "Please provide productId" });

    if (!isValidObjectId(productId))
      return res.status(400).send({status: false,message: `The given productId: ${productId} is not in proper format`,});

    const findProduct = await productModel.findOne({_id: productId,isDeleted: false, });

    if (!findProduct) 
      return res.status(404).send({ status: false,
        message: `Product details are not found with this productId: ${productId}, it must be deleted or not exists`,
      });

    if (!cartId)
      return res.status(400).send({ status: false, message: "Please provide cartId" });

    if (!isValidObjectId(cartId))
      return res.status(400).send({status: false,
        message: `The given cartId: ${cartId} is not in proper format`,});

    const findCart = await cartModel.findOne({ _id: cartId });

    if (!findCart)
      return res.status(404).send({status: false,
        message: `Cart does not exists with this provided cartId: ${cartId}`,});

    if (findCart.items.length == 0)
      return res.status(400).send({status: false,
        message: "You have not added any products in your cart",});

    //  if (!removeProduct)
    //   return res.status(400).send({ status: false, message: "removeProduct is required" });

    if (!(removeProduct == 0 || removeProduct == 1))
      return res.status(400).send({status: false,
        message: "Please enter valid removeproduct it can be only  `0` or `1`",});

    let cart = findCart.items;

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].productId == productId) {
        const priceChange = cart[i].quantity * findProduct.price;

        //when removeProduct is 0
        if (removeProduct == 0) {
          const productRemove = await cartModel.findOneAndUpdate(
            { _id: cartId },
            {
              $pull: { items: { productId: productId } },
              totalPrice: findCart.totalPrice - priceChange,
              totalItems: findCart.totalItems - 1,
            },
            { new: true }
          );

          
          return res.status(200).send({status: true,message: "product remove Successfully",data: productRemove,});
        }

        //when removeProduct is 1
        if (cart[i].quantity == 1 && removeProduct == 1) {
          const priceUpdate = await cartModel.findOneAndUpdate(
              { _id: cartId },
              {
                $pull: { items: { productId : productId} },
                totalPrice: findCart.totalPrice - priceChange,
                totalItems: findCart.totalItems - 1,
              },
              { new: true }
            );

          return res.status(200).send({status: true, message: "Success" ,data: priceUpdate });
        }

       // decrease the products quantity by 1

        cart[i].quantity = cart[i].quantity - 1;
        const updatedCart = await cartModel.findByIdAndUpdate(
            { _id: cartId },
            {
              items: cart,
              totalPrice: findCart.totalPrice - findProduct.price,
            },
            { new: true }
          );
        return res.status(200).send({status: true,message: "Success",data: updatedCart,});
        
      }
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};
//=================== get api ========================================================
const getCart = async function (req, res) {
  try {
      let userId = req.params.userId
      if (!userId) 
        return res.status(400).send({ status: false, message: "user id is not given" })
      
      if (!isValidObjectId(userId))
        return res.status(400).send({ status: false, msg: "User-id is not valid!" });
      
      const userData = await userModel.findById({ _id: userId })

      if (!userData) 
        return res.status(404).send({ status: false, message: "user you are searching does not exist" })
  
      const cartFind = await cartModel.findOne({ userId: userId })

      if (!cartFind) 
        return res.status(400).send({ status: false, message: "cart does not exist" })
      
      return res.status(200).send({ status: true, message: "Success", data: cartFind })

  } catch (err) {
      return res.status(500).send({ status: false, message: err.message })
  }
}

//================== delete api =====================================================
const deleteCart = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!userId)
      return res.status(400).send({ status: false, message: "userid must be present in params" });
     
    if (!isValidObjectId(userId)) 
      return res.status(400).send({ status: false, message: "Invalid UserId in params query." })

    // checking user exist or not
    let userExist = await userModel.findOne({ _id: userId })

    if (!userExist)
       return res.status(404).send({ status: false, message: " userId is not exit " })

    // checking cart exist or not
    let cartExist = await cartModel.findOne({ userId: userId })
                                    .select({items:1,totalItems:1,totalPrice:1,})
    
    if (!cartExist) 
      return res.status(404).send({ status: false, message: " cart is not exit " })

    //delete cart of the user
    let deletedCart = await cartModel.findOneAndUpdate(
        { userId: userId }, 
        {$set: {
              items: [],
              totalPrice: 0,
              totalItems: 0
          }
        },
        {new:true})

    return res.status(204).send({ status: true, message: "Success", data: deletedCart})

  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports={createCart, updateCart,getCart, deleteCart}
