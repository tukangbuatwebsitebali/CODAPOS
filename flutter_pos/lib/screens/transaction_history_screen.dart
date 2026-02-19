import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  List<dynamic> _transactions = [];
  bool _loading = true;
  final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
  final _dateFormat = DateFormat('dd MMM yyyy, HH:mm', 'id_ID');

  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }

  Future<void> _loadTransactions() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getTransactions(limit: 50);
      setState(() => _transactions = res['data']?['transactions'] ?? res['data'] ?? []);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF1DA1F2).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.receipt_long, size: 16, color: Color(0xFF1DA1F2)),
            ),
            const SizedBox(width: 10),
            const Text('Riwayat Transaksi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _loadTransactions,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF1DA1F2)))
          : _transactions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long, size: 56, color: Colors.white.withValues(alpha: 0.08)),
                      const SizedBox(height: 12),
                      Text('Belum ada transaksi', style: TextStyle(color: Colors.white.withValues(alpha: 0.3))),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: const Color(0xFF1DA1F2),
                  onRefresh: _loadTransactions,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _transactions.length,
                    itemBuilder: (ctx, i) {
                      final tx = _transactions[i];
                      final items = tx['items'] as List? ?? [];
                      final status = tx['status'] ?? 'completed';
                      final isCompleted = status == 'completed';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
                        ),
                        child: ExpansionTile(
                          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                          shape: const Border(),
                          leading: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: isCompleted
                                  ? const Color(0xFF10B981).withValues(alpha: 0.1)
                                  : Colors.orange.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              isCompleted ? Icons.check_circle : Icons.pending,
                              size: 18,
                              color: isCompleted ? const Color(0xFF10B981) : Colors.orange,
                            ),
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  tx['invoice_number'] ?? '#${tx['id']?.toString().substring(0, 8)}',
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                                ),
                              ),
                              Text(
                                _currencyFormat.format((tx['total'] ?? 0).toDouble()),
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF1DA1F2)),
                              ),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(
                              children: [
                                Icon(Icons.access_time, size: 12, color: Colors.white.withValues(alpha: 0.3)),
                                const SizedBox(width: 4),
                                Text(
                                  tx['created_at'] != null ? _dateFormat.format(DateTime.parse(tx['created_at'])) : '-',
                                  style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.3)),
                                ),
                                const SizedBox(width: 12),
                                Icon(Icons.payment, size: 12, color: Colors.white.withValues(alpha: 0.3)),
                                const SizedBox(width: 4),
                                Text(
                                  (tx['payment_method'] ?? 'cash').toString().toUpperCase(),
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.3)),
                                ),
                                if (items.isNotEmpty) ...[
                                  const SizedBox(width: 12),
                                  Text('${items.length} item', style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.3))),
                                ],
                              ],
                            ),
                          ),
                          children: [
                            Container(height: 1, color: Colors.white.withValues(alpha: 0.04)),
                            const SizedBox(height: 8),
                            ...items.map((item) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                children: [
                                  Container(
                                    width: 4,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1DA1F2).withValues(alpha: 0.4),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      item['product']?['name'] ?? item['product_name'] ?? 'Item',
                                      style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5)),
                                    ),
                                  ),
                                  Text(
                                    'x${item['quantity']}',
                                    style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.3)),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    _currencyFormat.format((item['subtotal'] ?? item['price'] ?? 0).toDouble()),
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.5)),
                                  ),
                                ],
                              ),
                            )),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
