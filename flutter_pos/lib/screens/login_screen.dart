import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isSubmitting = false;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) return;
    setState(() => _isSubmitting = true);
    final auth = context.read<AuthProvider>();
    await auth.login(_emailController.text.trim(), _passwordController.text);
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isLandscape = size.width > size.height;
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0A0E1A), Color(0xFF0F1629), Color(0xFF0A1628)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: isLandscape ? _buildLandscapeLayout(auth) : _buildPortraitLayout(auth),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLandscapeLayout(AuthProvider auth) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Left - Branding
        SizedBox(
          width: 340,
          child: _buildBranding(),
        ),
        const SizedBox(width: 60),
        // Right - Form
        SizedBox(
          width: 380,
          child: _buildLoginForm(auth),
        ),
      ],
    );
  }

  Widget _buildPortraitLayout(AuthProvider auth) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildBranding(),
        const SizedBox(height: 40),
        SizedBox(width: 400, child: _buildLoginForm(auth)),
      ],
    );
  }

  Widget _buildBranding() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Logo
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1DA1F2), Color(0xFF0D8ECF)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1DA1F2).withValues(alpha: 0.3),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Center(
            child: Text('C', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'CODAPOS',
          style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2),
        ),
        const SizedBox(height: 8),
        Text(
          'Point of Sale Tablet',
          style: TextStyle(fontSize: 16, color: Colors.white.withValues(alpha: 0.5), fontWeight: FontWeight.w300),
        ),
        const SizedBox(height: 24),
        // Features
        ...[
          ('🚀', 'Kasir cepat & akurat'),
          ('📊', 'Laporan real-time'),
          ('🔒', 'Aman & terenkripsi'),
        ].map((f) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Text(f.$1, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 12),
              Text(f.$2, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.5))),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildLoginForm(AuthProvider auth) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Masuk ke Akun',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const SizedBox(height: 6),
          Text(
            'Silakan login untuk memulai',
            style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.4)),
          ),
          const SizedBox(height: 28),

          // Error
          if (auth.error != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, size: 16, color: Color(0xFFEF4444)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(auth.error!, style: const TextStyle(fontSize: 12, color: Color(0xFFEF4444))),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Email
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              labelText: 'Email',
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 13),
              prefixIcon: Icon(Icons.email_outlined, size: 20, color: Colors.white.withValues(alpha: 0.3)),
            ),
            onSubmitted: (_) => _handleLogin(),
          ),
          const SizedBox(height: 16),

          // Password
          TextField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              labelText: 'Password',
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 13),
              prefixIcon: Icon(Icons.lock_outline, size: 20, color: Colors.white.withValues(alpha: 0.3)),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 20,
                  color: Colors.white.withValues(alpha: 0.3),
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            onSubmitted: (_) => _handleLogin(),
          ),
          const SizedBox(height: 28),

          // Login Button
          ElevatedButton(
            onPressed: _isSubmitting ? null : _handleLogin,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isSubmitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.login, size: 18),
                      SizedBox(width: 8),
                      Text('Masuk', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    ],
                  ),
          ),
          const SizedBox(height: 16),

          // Version
          Center(
            child: Text(
              'v1.0.0 • CODAPOS Tablet',
              style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.2)),
            ),
          ),
        ],
      ),
    );
  }
}
