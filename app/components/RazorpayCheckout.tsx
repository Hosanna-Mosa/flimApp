import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Text, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

interface RazorpayCheckoutProps {
  visible: boolean;
  options: any;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
  onClose: () => void;
}

const razorpayHtml = (data: any) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
      body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; background: #fff; }
      .loader { border: 4px solid #f3f3f3; border-top: 4px solid ${data?.theme?.color || '#D4AF37'}; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="loader"></div>
    <script>
      const options = ${JSON.stringify(data)};
      
      options.handler = function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          status: 'success',
          response: response
        }));
      };
      
      options.modal = {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            status: 'cancelled'
          }));
        }
      };

      try {
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            status: 'failed',
            error: response.error
          }));
        });
        
        window.onload = function() {
          rzp.open();
        };
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          status: 'failed',
          error: { description: 'JS Error: ' + e.message }
        }));
      }
    </script>
  </body>
</html>
`;

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  visible,
  options,
  onSuccess,
  onFailure,
  onClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment Secure</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {visible && options && (
            <WebView
              source={{ 
                html: razorpayHtml(options)
              }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.status === 'success') {
                    onSuccess(data.response);
                  } else if (data.status === 'cancelled') {
                    onClose();
                  } else if (data.status === 'failed') {
                    onFailure(data.error);
                  }
                } catch (e) {
                  console.error('Razorpay component error:', e);
                }
              }}
              style={{ flex: 1 }}
              javaScriptEnabled={true}
              originWhitelist={['*']}
              domStorageEnabled={true}
              onShouldStartLoadWithRequest={(request) => {
                if (request.url.startsWith('upi://') || 
                    request.url.startsWith('whatsapp://') || 
                    request.url.startsWith('phonepe://') || 
                    request.url.startsWith('tez://')) {
                  Linking.openURL(request.url).catch(() => {
                    Alert.alert('Error', 'No UPI app found on this device');
                  });
                  return false;
                }
                return true;
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default RazorpayCheckout;
