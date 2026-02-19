import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Change this to your backend URL
  static const String baseUrl = 'http://10.0.2.2:8080/api'; // Android emulator -> localhost
  // For iOS simulator: http://localhost:8080/api
  // For real device: http://<your-ip>:8080/api

  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  static String? get token => _token;

  static Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  // -------- Auth --------

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _handleResponse(res);
  }

  // -------- Products --------

  static Future<Map<String, dynamic>> getProducts({String? category}) async {
    final uri = Uri.parse('$baseUrl/products').replace(
      queryParameters: category != null ? {'category_id': category} : null,
    );
    final res = await http.get(uri, headers: _headers);
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> getCategories() async {
    final res = await http.get(Uri.parse('$baseUrl/products/categories'), headers: _headers);
    return _handleResponse(res);
  }

  // -------- POS / Transactions --------

  static Future<Map<String, dynamic>> createTransaction(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/pos/checkout'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return _handleResponse(res);
  }

  static Future<Map<String, dynamic>> getTransactions({int limit = 20, int offset = 0}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/transactions?limit=$limit&offset=$offset'),
      headers: _headers,
    );
    return _handleResponse(res);
  }

  // -------- Profile --------

  static Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(Uri.parse('$baseUrl/me'), headers: _headers);
    return _handleResponse(res);
  }

  // -------- Helpers --------

  static Map<String, dynamic> _handleResponse(http.Response res) {
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return body;
    }
    throw ApiException(body['error'] ?? 'Unknown error', res.statusCode);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
