import 'package:flutter/material.dart';

class CartItem {
  final String productId;
  final String name;
  final double price;
  final String? imageUrl;
  int quantity;

  CartItem({
    required this.productId,
    required this.name,
    required this.price,
    this.imageUrl,
    this.quantity = 1,
  });

  double get total => price * quantity;

  Map<String, dynamic> toCheckoutJson() => {
    'product_id': productId,
    'quantity': quantity,
    'price': price,
  };
}

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  String _paymentMethod = 'cash';
  double _customerPay = 0;
  String? _customerName;

  List<CartItem> get items => _items;
  String get paymentMethod => _paymentMethod;
  double get customerPay => _customerPay;
  String? get customerName => _customerName;

  int get totalItems => _items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.total);

  double get tax => subtotal * 0.11; // PPN 11%

  double get grandTotal => subtotal + tax;

  double get change => _customerPay - grandTotal;

  void addItem(String productId, String name, double price, {String? imageUrl}) {
    final existing = _items.where((i) => i.productId == productId).toList();
    if (existing.isNotEmpty) {
      existing.first.quantity++;
    } else {
      _items.add(CartItem(productId: productId, name: name, price: price, imageUrl: imageUrl));
    }
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.productId == productId);
    notifyListeners();
  }

  void updateQuantity(String productId, int qty) {
    final item = _items.where((i) => i.productId == productId).toList();
    if (item.isNotEmpty) {
      if (qty <= 0) {
        removeItem(productId);
      } else {
        item.first.quantity = qty;
        notifyListeners();
      }
    }
  }

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    notifyListeners();
  }

  void setCustomerPay(double amount) {
    _customerPay = amount;
    notifyListeners();
  }

  void setCustomerName(String? name) {
    _customerName = name;
    notifyListeners();
  }

  Map<String, dynamic> toCheckoutJson() => {
    'items': _items.map((i) => i.toCheckoutJson()).toList(),
    'payment_method': _paymentMethod,
    'customer_pay': _customerPay,
    'subtotal': subtotal,
    'tax': tax,
    'total': grandTotal,
    if (_customerName != null) 'customer_name': _customerName,
  };

  void clear() {
    _items.clear();
    _customerPay = 0;
    _customerName = null;
    _paymentMethod = 'cash';
    notifyListeners();
  }
}
