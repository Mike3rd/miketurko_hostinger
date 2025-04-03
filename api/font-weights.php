<?php
header('Content-Type: application/json');

$font = isset($_GET['font']) ? urldecode($_GET['font']) : '';
$api_key = 'AIzaSyARRFGcO7LK9TqPA-wvLw2kEzRBooMMMVU'; // Replace with valid key

// Clean font name
$clean_font = str_replace(' ', '+', trim($font));
$url = "https://www.googleapis.com/webfonts/v1/webfonts?key=$api_key&family=$clean_font";

try {
    $response = file_get_contents($url);
    
    if($response === false) {
        throw new Exception('API request failed');
    }
    
    $data = json_decode($response, true);
    
    if(empty($data['items'])) {
        echo json_encode(['400']); // Fallback
        exit;
    }
    
    $weights = $data['items'][0]['variants'];
    echo json_encode($weights);
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>