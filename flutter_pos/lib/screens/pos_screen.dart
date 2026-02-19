import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'transaction_history_screen.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  String? _selectedCategory;
  bool _loading = true;
  String _searchQuery = '';
  final _searchController = TextEditingController();
  final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getProducts(),
        ApiService.getCategories(),
      ]);
      setState(() {
        _products = results[0]['data'] ?? [];
        _categories = results[1]['data'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
    setState(() => _loading = false);
  }

  List<dynamic> get _filteredProducts {
    var filtered = _products;
    if (_selectedCategory != null) {
      filtered = filtered.where((p) => p['category_id'] == _selectedCategory).toList();
    }
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((p) =>
        (p['name'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase())
      ).toList();
    }
    return filtered;
  }

  Future<void> _handleCheckout() async {
    final cart = context.read<CartProvider>();
    if (cart.items.isEmpty) return;

    // Show payment dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _PaymentDialog(cart: cart, currencyFormat: _currencyFormat),
    );

    if (confirmed == true && mounted) {
      try {
        await ApiService.createTransaction(cart.toCheckoutJson());
        cart.clear();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text('Transaksi berhasil! 🎉'),
                ],
              ),
              backgroundColor: const Color(0xFF10B981),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      } on ApiException catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.message}'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: Row(
        children: [
          // LEFT: Product Grid
          Expanded(
            flex: 3,
            child: Column(
              children: [
                _buildTopBar(auth),
                _buildCategoryBar(),
                _buildSearchBar(),
                Expanded(child: _buildProductGrid(cart)),
              ],
            ),
          ),
          // RIGHT: Cart Panel
          SizedBox(
            width: 360,
            child: _buildCartPanel(cart),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar(AuthProvider auth) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
      ),
      child: Row(
        children: [
          // Logo
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF1DA1F2), Color(0xFF0D8ECF)]),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
              child: Text('C', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('CODAPOS', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 1)),
              Text('POS Tablet', style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.4))),
            ],
          ),
          const Spacer(),
          // Transaction History
          _TopBarButton(
            icon: Icons.receipt_long,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TransactionHistoryScreen())),
          ),
          const SizedBox(width: 8),
          // Refresh
          _TopBarButton(icon: Icons.refresh, onTap: _loadData),
          const SizedBox(width: 8),
          // User info
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: const Color(0xFF1DA1F2).withValues(alpha: 0.2),
                  child: Text(
                    auth.userName.isNotEmpty ? auth.userName[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF1DA1F2)),
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(auth.userName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                    Text(auth.userRole, style: TextStyle(fontSize: 9, color: Colors.white.withValues(alpha: 0.3))),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _TopBarButton(icon: Icons.logout, onTap: () => auth.logout(), color: Colors.red.withValues(alpha: 0.6)),
        ],
      ),
    );
  }

  Widget _buildCategoryBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1629),
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.04))),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _CategoryChip(
              label: 'Semua',
              isSelected: _selectedCategory == null,
              onTap: () => setState(() => _selectedCategory = null),
              emoji: '📋',
            ),
            ..._categories.map((cat) => _CategoryChip(
              label: cat['name'] ?? '',
              isSelected: _selectedCategory == cat['id'],
              onTap: () => setState(() => _selectedCategory = cat['id']),
              emoji: _getCategoryEmoji(cat['name'] ?? ''),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchController,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        onChanged: (v) => setState(() => _searchQuery = v),
        decoration: InputDecoration(
          hintText: 'Cari produk...',
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          prefixIcon: Icon(Icons.search, size: 18, color: Colors.white.withValues(alpha: 0.3)),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 16),
                  onPressed: () { _searchController.clear(); setState(() => _searchQuery = ''); },
                )
              : null,
        ),
      ),
    );
  }

  Widget _buildProductGrid(CartProvider cart) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF1DA1F2)));
    }

    final products = _filteredProducts;
    if (products.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 48, color: Colors.white.withValues(alpha: 0.1)),
            const SizedBox(height: 12),
            Text('Produk tidak ditemukan', style: TextStyle(color: Colors.white.withValues(alpha: 0.3))),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 1200 ? 4 : 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: products.length,
      itemBuilder: (ctx, i) {
        final p = products[i];
        return _ProductCard(
          name: p['name'] ?? '',
          price: (p['base_price'] ?? 0).toDouble(),
          category: p['category']?['name'] ?? '',
          currencyFormat: _currencyFormat,
          onTap: () => cart.addItem(p['id'], p['name'] ?? '', (p['base_price'] ?? 0).toDouble()),
        );
      },
    );
  }

  Widget _buildCartPanel(CartProvider cart) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        border: Border(left: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
      ),
      child: Column(
        children: [
          // Cart Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
            ),
            child: Row(
              children: [
                const Icon(Icons.shopping_cart_outlined, size: 18, color: Color(0xFF1DA1F2)),
                const SizedBox(width: 8),
                const Text('Keranjang', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                const Spacer(),
                if (cart.items.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1DA1F2).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${cart.totalItems}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF1DA1F2)),
                    ),
                  ),
                if (cart.items.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: () => cart.clear(),
                    child: Icon(Icons.delete_outline, size: 18, color: Colors.red.withValues(alpha: 0.5)),
                  ),
                ],
              ],
            ),
          ),

          // Cart Items
          Expanded(
            child: cart.items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_cart_outlined, size: 40, color: Colors.white.withValues(alpha: 0.08)),
                        const SizedBox(height: 10),
                        Text('Keranjang kosong', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.25))),
                        const SizedBox(height: 4),
                        Text('Tap produk untuk menambahkan', style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.15))),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    itemCount: cart.items.length,
                    itemBuilder: (ctx, i) {
                      final item = cart.items[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 2),
                                  Text(_currencyFormat.format(item.price), style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4))),
                                ],
                              ),
                            ),
                            // Quantity controls
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  _QtyButton(icon: Icons.remove, onTap: () => cart.updateQuantity(item.productId, item.quantity - 1)),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 10),
                                    child: Text('${item.quantity}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
                                  ),
                                  _QtyButton(icon: Icons.add, onTap: () => cart.updateQuantity(item.productId, item.quantity + 1)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              _currencyFormat.format(item.total),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF1DA1F2)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Summary & Checkout
          if (cart.items.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F1629),
                border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.06))),
              ),
              child: Column(
                children: [
                  _SummaryRow(label: 'Subtotal', value: _currencyFormat.format(cart.subtotal)),
                  const SizedBox(height: 4),
                  _SummaryRow(label: 'PPN 11%', value: _currencyFormat.format(cart.tax)),
                  const SizedBox(height: 8),
                  Container(height: 1, color: Colors.white.withValues(alpha: 0.06)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
                      Text(_currencyFormat.format(cart.grandTotal), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1DA1F2))),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleCheckout,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 4,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.payment, size: 18),
                          const SizedBox(width: 8),
                          const Text('Bayar Sekarang', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _getCategoryEmoji(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('makanan') || lower.contains('food')) return '🍽️';
    if (lower.contains('minuman') || lower.contains('drink')) return '🥤';
    if (lower.contains('snack') || lower.contains('camilan')) return '🍿';
    if (lower.contains('dessert') || lower.contains('kue')) return '🍰';
    if (lower.contains('kopi') || lower.contains('coffee')) return '☕';
    return '📦';
  }
}

// -------- Sub-widgets --------

class _TopBarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;
  const _TopBarButton({required this.icon, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: color ?? Colors.white.withValues(alpha: 0.5)),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final String emoji;
  final bool isSelected;
  final VoidCallback onTap;
  const _CategoryChip({required this.label, required this.isSelected, required this.onTap, required this.emoji});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF1DA1F2).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF1DA1F2).withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.06),
            ),
          ),
          child: Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? const Color(0xFF1DA1F2) : Colors.white.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final String name;
  final double price;
  final String category;
  final NumberFormat currencyFormat;
  final VoidCallback onTap;
  const _ProductCard({required this.name, required this.price, required this.category, required this.currencyFormat, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF1DA1F2).withValues(alpha: 0.08),
                      const Color(0xFF0D8ECF).withValues(alpha: 0.04),
                    ],
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                ),
                child: Center(
                  child: Icon(Icons.fastfood_rounded, size: 36, color: Colors.white.withValues(alpha: 0.15)),
                ),
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (category.isNotEmpty)
                    Text(category, style: TextStyle(fontSize: 9, color: const Color(0xFF1DA1F2).withValues(alpha: 0.7), fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(currencyFormat.format(price), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF1DA1F2))),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1DA1F2).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.add, size: 14, color: Color(0xFF1DA1F2)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _QtyButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 14, color: Colors.white.withValues(alpha: 0.5)),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.6))),
      ],
    );
  }
}

// -------- Payment Dialog --------

class _PaymentDialog extends StatefulWidget {
  final CartProvider cart;
  final NumberFormat currencyFormat;
  const _PaymentDialog({required this.cart, required this.currencyFormat});

  @override
  State<_PaymentDialog> createState() => _PaymentDialogState();
}

class _PaymentDialogState extends State<_PaymentDialog> {
  final _payController = TextEditingController();
  String _method = 'cash';

  @override
  void dispose() {
    _payController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = widget.cart;
    final fmt = widget.currencyFormat;
    final payAmount = double.tryParse(_payController.text) ?? 0;
    final change = payAmount - cart.grandTotal;

    return Dialog(
      backgroundColor: const Color(0xFF111827),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        width: 420,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1DA1F2).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.payment, color: Color(0xFF1DA1F2), size: 22),
                ),
                const SizedBox(width: 12),
                const Text('Pembayaran', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
              ],
            ),
            const SizedBox(height: 20),

            // Total
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF1DA1F2).withValues(alpha: 0.1), const Color(0xFF0D8ECF).withValues(alpha: 0.05)],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF1DA1F2).withValues(alpha: 0.2)),
              ),
              child: Column(
                children: [
                  Text('Total Bayar', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.4))),
                  const SizedBox(height: 4),
                  Text(fmt.format(cart.grandTotal), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1DA1F2))),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Payment method
            Text('Metode Pembayaran', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.5))),
            const SizedBox(height: 8),
            Row(
              children: [
                _MethodChip(label: 'Tunai', icon: Icons.money, isSelected: _method == 'cash', onTap: () => setState(() => _method = 'cash')),
                const SizedBox(width: 8),
                _MethodChip(label: 'QRIS', icon: Icons.qr_code, isSelected: _method == 'qris', onTap: () => setState(() => _method = 'qris')),
                const SizedBox(width: 8),
                _MethodChip(label: 'Transfer', icon: Icons.account_balance, isSelected: _method == 'transfer', onTap: () => setState(() => _method = 'transfer')),
              ],
            ),
            const SizedBox(height: 16),

            // Cash input
            if (_method == 'cash') ...[
              TextField(
                controller: _payController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  labelText: 'Uang Diterima',
                  labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
                  prefixText: 'Rp ',
                  prefixStyle: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 16),
                ),
              ),
              const SizedBox(height: 8),
              // Quick amounts
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [50000, 100000, 200000, 500000].map((amt) {
                  return InkWell(
                    onTap: () {
                      _payController.text = '$amt';
                      setState(() {});
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      child: Text(fmt.format(amt), style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.6))),
                    ),
                  );
                }).toList(),
              ),
              if (payAmount >= cart.grandTotal) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Kembalian', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5))),
                      Text(fmt.format(change), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF10B981))),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ] else
              const SizedBox(height: 16),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text('Batal', style: TextStyle(color: Colors.white.withValues(alpha: 0.5))),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: (_method != 'cash' || payAmount >= cart.grandTotal)
                        ? () {
                            cart.setPaymentMethod(_method);
                            if (_method == 'cash') cart.setCustomerPay(payAmount);
                            Navigator.pop(context, true);
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      disabledBackgroundColor: Colors.white.withValues(alpha: 0.05),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline, size: 18),
                        SizedBox(width: 6),
                        Text('Konfirmasi', style: TextStyle(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MethodChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  const _MethodChip({required this.label, required this.icon, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF1DA1F2).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF1DA1F2).withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.06),
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: isSelected ? const Color(0xFF1DA1F2) : Colors.white.withValues(alpha: 0.3)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 10, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400, color: isSelected ? const Color(0xFF1DA1F2) : Colors.white.withValues(alpha: 0.4))),
            ],
          ),
        ),
      ),
    );
  }
}
