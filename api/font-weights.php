<?php
header('Access-Control-Allow-Origin: https://miketurko.com');
header('Content-Type: application/json');

// Temporary error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$font = isset($_GET['font']) ? urldecode($_GET['font']) : '';
$api_key = 'YOUR_API_KEY'; // Replace with actual key

// Convert spaces to +
$api_font_name = str_replace(' ', '+', $font);

// Build API URL
$url = "https://www.googleapis.com/webfonts/v1/webfonts?key=$api_key&family=$api_font_name";

try {
    $response = file_get_contents($url);
    
    if($response === FALSE) {
        throw new Exception('Google Fonts API request failed');
    }
    
    $data = json_decode($response, true);
    
    if(empty($data['items'])) {
        echo json_encode(['400', '500', '700']); // Fallback weights
        exit;
    }
    
    $weights = $data['items'][0]['variants'];
    echo json_encode($weights);
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'weights' => ['400', '500', '700']]);
}

// Log the request
file_put_contents('font_weights.log', date('Y-m-d H:i:s')." - $font\n", FILE_APPEND);
?>