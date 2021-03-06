/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
	  cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
	  cart: {
		productList: '.cart__order-summary',
		toggleTrigger: '.cart__summary',
		totalNumber: `.cart__total-number`,
		totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
		subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
		deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
		form: '.cart__order',
		formSubmit: '.cart__order [type="submit"]',
		phone: '[name="phone"]',
		address: '[name="address"]',
	  },
	  cartProduct: {
		amountWidget: '.widget-amount',
		price: '.cart__product-price',
		edit: '[href="#edit"]',
		remove: '[href="#remove"]',
	  },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
	cart: {
		wrapperActive: 'active',
	},
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
	cart: {
		defaultDeliveryFee: 20,
	},
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
	cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };
  
  class AmountWidget{
	  constructor(element){
		  const thisWidget = this;
		  
		  thisWidget.getElements(element);
		  thisWidget.setValue(thisWidget.input.value);
		  thisWidget.initActions();
		  
		  
		  /*console.log('AmountWidget:', thisWidget);
		  console.log('constructor arguments:', element);*/
	  }
	  announce(){
		  const thisWidget = this;
		  
		  const event = new CustomEvent('updated', {bubbles: true});
		  thisWidget.element.dispatchEvent(event);
	  }
	  initActions(){
		  const thisWidget = this;
		  
		  thisWidget.input.addEventListener('change',function(){thisWidget.setValue(thisWidget.input.value);});
		  thisWidget.linkDecrease.addEventListener('click',function(){
																	event.preventDefault();
																	let decreasedValue = thisWidget.value-1;
																	thisWidget.setValue(decreasedValue);
																	});
		  thisWidget.linkIncrease.addEventListener('click',function(){
																	event.preventDefault();
																	let incresedValue = thisWidget.value+1;
																	thisWidget.setValue(incresedValue);
																	});
	  }
	  getElements(element){
		  const thisWidget = this;
		  
		  thisWidget.element = element;
		  thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
		  thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
		  thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
		  /*console.log("thisWidget",thisWidget.input);
		  console.log("select.widgets.amount.input",select.widgets.amount.input);*/
	  }
	  setValue(value){
		  const thisWidget = this;
		  
		  const newValue = parseInt(value);
		  
		  //console.log("new value:",newValue);
		  //console.log(thisWidget.value);
		  //console.log(thisWidget);
		  
		  if(thisWidget.value !== newValue && !isNaN(newValue) && newValue > 0 && newValue <= 10){
			thisWidget.value = newValue;
			
		  }
		  thisWidget.input.value = thisWidget.value;
		  thisWidget.announce();
	  }
  }
  
  class Product{
	  constructor(id, data){
		  const thisProduct = this;
		  
		  thisProduct.id = id;
		  thisProduct.data = data;
		  
		  thisProduct.renderInMenu();
		  
		  thisProduct.getElements();
		  
		  thisProduct.initAcordion();	
		  
		  thisProduct.initOrderForm();
		  
		  thisProduct.initAmountWidget();
		  
		  thisProduct.processOrder();
		  
		  //console.log('new Product:', thisProduct);
	  }
	  renderInMenu(){
		  const thisProduct = this;
		  
		  const generatedHTML = templates.menuProduct(thisProduct.data);
		  thisProduct.element = utils.createDOMFromHTML(generatedHTML);
		  
		  const menuContainer = document.querySelector(select.containerOf.menu);
		  menuContainer.appendChild(thisProduct.element);
	  }
	  prepareCartProduct(){
          const thisProduct = this;

          const productSummary = {
            "id":thisProduct.id,
            "name":thisProduct.data.name,
            "amount":thisProduct.amountWidget.input.value,
            "priceSingle":thisProduct.priceSingle,
            "price":(thisProduct.priceSingle*parseInt(thisProduct.amountWidget.input.value)),
            "params":{}
          };
          productSummary.params = thisProduct.prepareCartProductParams();
          //console.log(thisProduct);
          return productSummary;
	  }
	  prepareCartProductParams(){
		  const thisProduct = this;

		  const formData = utils.serializeFormToObject(thisProduct.form);
		  let params = {};

		  //console.log('thisProduct.data.params',thisProduct.data.params)

		  for(let paramId in thisProduct.data.params){
			  const param = thisProduct.data.params[paramId];
              params[paramId] = {
                label:param.label,
                "options":{}
              };
			  for(let optionId in param.options){
				  const option = param.options[optionId];
				  if(formData.hasOwnProperty(paramId)){
					  if(formData[paramId].includes(optionId)){
                        params[paramId].options[optionId] = option;
					  }
				  }
			  }
		  }
		  //console.log('params',params);
		  return params;
	  }
	  getElements(){
		  const thisProduct = this;
		  
		  thisProduct.acordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
		  thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
		  thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
		  thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
		  thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
		  thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
		  thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
		  
	  }
	  initAcordion(){
		  const thisProduct = this;
		  
		  thisProduct.acordionTrigger.addEventListener('click',function(event){
			event.preventDefault();
			
			const activeProducts = document.querySelectorAll('article.product.active');
			for(let activeProduct of activeProducts){
				if(activeProduct != thisProduct.element){
					activeProduct.classList.remove('active');
					}
				}
			thisProduct.element.classList.toggle("active");
			});
	  }
	  initOrderForm(){
		  const thisProduct = this;
		  
		  thisProduct.form.addEventListener('submit', function(event){
			  event.preventDefault();
			  thisProduct.processOrder();
		  });
		  for(let input of thisProduct.formInputs){
			  input.addEventListener('change', function(){
				  thisProduct.processOrder();
			  })
		  }
		  thisProduct.cartButton.addEventListener('click', function(event) {
			  event.preventDefault();
			  thisProduct.processOrder();
			  thisProduct.addToCart();
		  })
	  }
	  initAmountWidget(){
		  const thisProduct = this;
		  
		  thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
		  thisProduct.amountWidgetElem.addEventListener('updated',function(){thisProduct.processOrder()});
	  }
	  addToCart(){
	      const thisProduct = this;

	      app.cart.add(thisProduct.prepareCartProduct());
	  }
	  processOrder(){
		  const thisProduct = this;
		  
		  const formData = utils.serializeFormToObject(thisProduct.form);
		  
		  let price = thisProduct.data.price;
		  let images = thisProduct.imageWrapper;
		  
		  for(let paramId in thisProduct.data.params){
			  const param = thisProduct.data.params[paramId];
			  
			  for(let optionId in param.options){
				  const option = param.options[optionId];
				  if(formData.hasOwnProperty(paramId)){
					  const optionImage = thisProduct.imageWrapper.querySelector("."+paramId+"-"+optionId);
					  if(optionImage){
							optionImage.classList.add("active");
					  }					  
					  if(formData[paramId].includes(optionId) && !option.default){
						  price = price + option.price;
					  }
					  else if(!formData[paramId].includes(optionId) && option.default){
						  price -= option.price;
						  if(optionImage){
							  optionImage.classList.remove("active");
						  }					  }
					  else if(!formData[paramId].includes(optionId) && !option.default){
						  if(optionImage){
							  optionImage.classList.remove("active");
						  }
					  }
				  }
			  }
		  }
		  thisProduct.priceSingle = price;
		  price *= thisProduct.amountWidget.value;
		  thisProduct.priceElem.innerHTML = price;
	  }
  }
  class Cart{
	  constructor(element){
		  const thisCart = this;
		  
		  thisCart.products = [];
		  
		  thisCart.getElements(element);
		  thisCart.initActions();

		  //console.log('new cart', thisCart);
	  }
	  initActions(){
          const thisCart = this;

          thisCart.dom.toggleTrigger.addEventListener('click',function(){thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive)})

          thisCart.dom.productList.addEventListener('updated', function(){
            thisCart.update();
          });
          thisCart.dom.productList.addEventListener('remove', function(){
            thisCart.remove(event.detail.cartProduct);
          });
	  }
	  getElements(element){
		  const thisCart = this;
		  
		  thisCart.dom = {};
		  
		  thisCart.dom.wrapper = element;
		  thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);

		  thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);

		  thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
		  thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
		  thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
		  thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
	  }
	  add(menuProduct){
	      const thisCart = this;

		  const generatedHTML = templates.cartProduct(menuProduct);
		  const generatedDOM = utils.createDOMFromHTML(generatedHTML);

		  thisCart.dom.productList.appendChild(generatedDOM);

		  thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
		  console.log('thisCart.products',thisCart.products);
		  thisCart.update();
	      //console.log('adding product', menuProduct);
	  }
	  update(){
	    const thisCart = this;

	    thisCart.deliveryFee = parseInt(thisCart.dom.wrapper.querySelector(select.cart.deliveryFee).innerHTML);
	    let totalNumber = 0;
	    let subtotalPrice = 0;
	    console.log('thisCart.products',thisCart.products);

	    for(let product of thisCart.products){
            subtotalPrice += product.priceSingle * parseInt(product.amountWidget.value);
            totalNumber += parseInt(product.amountWidget.value);
	    }
	    if(subtotalPrice > 0){
	        thisCart.totalPrice = subtotalPrice + thisCart.deliveryFee;
	    }else{
	        thisCart.totalPrice = 0;
	    }
	    thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
	    thisCart.dom.totalNumber.innerHTML = totalNumber;
	    for(let price of thisCart.dom.totalPrice){
	        price.innerHTML = thisCart.totalPrice;
	    }
	  }
	  remove(product){
	    const thisCart = this;

	    console.log('product',product);
	    console.log("thisCart.dom.wrapper",thisCart.dom.wrapper);
	    product.dom.wrapper.remove();
	    const indexOfProduct = thisCart.products.indexOf(product);
	    thisCart.products.splice(indexOfProduct,1);

	    thisCart.update();
	  }
  }
  class CartProduct{
    constructor(menuProduct,element){
        const thisCartProduct = this;

        for(let paramId in menuProduct){
            thisCartProduct[paramId] = menuProduct[paramId];
        }

        thisCartProduct.getElements(element);
        thisCartProduct.initAmountWidget();
        thisCartProduct.initActions();
    }
      initActions(){
          const thisCartProduct = this;

          thisCartProduct.dom.edit.addEventListener('click',function(){event.preventDefault();});
          thisCartProduct.dom.remove.addEventListener('click',function(){
            event.preventDefault();
            thisCartProduct.remove();
          });
      }
	  initAmountWidget(){
		  const thisCartProduct = this;

		  thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
		  thisCartProduct.dom.amountWidget.addEventListener('updated',function(){
		                                        thisCartProduct.dom.price.innerHTML = thisCartProduct.amountWidget.value * thisCartProduct.priceSingle;
		                                        });
	  }
	  getElements(element){
        const thisCartProduct = this;

        thisCartProduct.dom = {};
        thisCartProduct.dom.wrapper = element;
        thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
        thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
        thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
        thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    remove(){
        const thisCartProduct = this;
        console.log("remove");
        const event = new CustomEvent('remove',{
            bubbles:true,
            detail:{
                cartProduct:  thisCartProduct,
            },
        });

        thisCartProduct.dom.wrapper.dispatchEvent(event);

    }
  }

  const app = {
	initData: function(){
	  const thisApp = this;
	  
	  thisApp.data = dataSource;
	},
	initMenu: function(){
	  const thisApp = this;

	  for(let productData in thisApp.data.products){
		  new Product(productData, thisApp.data.products[productData]);
	  }
	},
	initCart: function() {
		const thisApp = this;
		
		const cartElem = document.querySelector(select.containerOf.cart);
		thisApp.cart = new Cart(cartElem);
	},
    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      /*console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);*/
	  
	  thisApp.initData();
	  thisApp.initMenu();
	  thisApp.initCart();
    },
  };

  app.init();
}
