<?php
header('Access-Control-Allow-Origin: http://localhost:1313');
header('Content-Type: application/json');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

$font = isset($_GET['font']) ? urldecode($_GET['font']) : '';
$api_key = 'AIzaSyARRFGcO7LK9TqPA-wvLw2kEzRBooMMMVU'; // Get from Google Cloud Console

// Convert to Google API format
$api_font_name = str_replace(' ', '+', $font);
$url = "https://www.googleapis.com/webfonts/v1/webfonts?key=$api_key&family=$api_font_name";

try {
    $response = file_get_contents($url);
    
    if($response === false) {
        throw new Exception('Google API request failed');
    }
    
    $data = json_decode($response, true);
    
    if(empty($data['items'])) {
        echo json_encode(['400', '500', '700']); // Fallback
        exit;
    }
    
    $weights = $data['items'][0]['variants'];
    echo json_encode($weights);
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'weights' => ['400']]);
}

?>