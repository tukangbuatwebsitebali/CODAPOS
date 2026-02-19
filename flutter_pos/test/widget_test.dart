// Basic smoke test for CodaPOS Tablet app.

import 'package:flutter_test/flutter_test.dart';
import 'package:codapos_tablet/main.dart';

void main() {
  testWidgets('CodaPOS app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const CodaPOSApp());

    // Verify the app renders without crashing.
    // The app shows either LoginScreen or POSScreen depending on auth state.
    await tester.pumpAndSettle();
  });
}
