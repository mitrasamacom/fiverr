const router = require('express').Router();
const stripe = require('stripe')('sk_test_ww69VBDOJxhHiwh4yz7NsxkJ');
const Gig = require('../models/gig');

const fee = 3.15;


router.get('/checkout/single_package/:id', (req, res, next) => {
  Gig.findOne({ _id: req.params.id }, function(err, gig) {
    var totalPrice = gig.price + fee;
    req.session.gig = gig;
    req.session.price = totalPrice;
    res.render('checkout/single_package', { gig: gig, totalPrice: totalPrice });
  });
});

router.route('/payment')
  .get((req, res, next) => {
    res.render('checkout/payment');
  })
  .post((req, res, next) => {
    var gig = req.session.gig;
    var price = req.session.price;
    price *= 100;   
    stripe.customers.create({
      email: req.user.email
    }).then((customer) => {
      return stripe.customers.createSource(customer.id, {
        source: req.body.stripeToken
      });
    }).then((source) => {
      return stripe.charges.create({
        amount: price,
        currency: 'usd',
        customer: source.customer
      });
    }).then((charge) => {
      // do something
      var order = new order();
      order.buyer = req.user._id;
      order.seller = gig.owner;
      order.gig = gig._id;
      order.save(function(err) {
        req.session.gig = null;                                                                                                     
        req.session.price = null;
        res.redirect('/users/' + req.user._id + '/orders/' + order._id);
      });
    }).catch((err) => {
      // Deal with an error 
    });
  });

router.get('/users/:userId/orders/:orderId', (req, res, next) => {
  req.session.orderId = req.params.orderId;
  Order.findOne({ _id: req.params.orderId })
    .populate('buyer')
    .populate('seller')
    .populate('gig')
    .exec(function(err, order) {
      res.render('order/order-room', { layout: 'chat_layout', order: order });
    });
});

module.exports = router;