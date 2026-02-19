import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = true;
  Map<String, dynamic>? _user;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;
  String get userName => _user?['full_name'] ?? 'User';
  String get userRole => _user?['role'] ?? 'staff';

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      await ApiService.init();
      if (ApiService.token != null) {
        final res = await ApiService.getProfile();
        _user = res['data'];
        _isAuthenticated = true;
      }
    } catch (_) {
      await ApiService.clearToken();
      _isAuthenticated = false;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.login(email, password);
      final token = res['data']?['token'] ?? res['token'];
      if (token != null) {
        await ApiService.setToken(token);
        // Get profile
        try {
          final profile = await ApiService.getProfile();
          _user = profile['data'];
        } catch (_) {
          _user = {'full_name': email.split('@')[0], 'email': email};
        }
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = 'Token not received';
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Koneksi gagal. Periksa server.';
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
