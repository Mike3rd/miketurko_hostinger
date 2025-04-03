<?php
$log = date('[Y-m-d H:i:s]') . " | Style: $style | IP: {$_SERVER['REMOTE_ADDR']}\n";
file_put_contents('font_requests.log', $log, FILE_APPEND);

header('Access-Control-Allow-Origin: https://miketurko.com');
header('Content-Type: application/json');

$allowed_styles = ['corporate', 'modern', 'fun', 'wild', 'extraterrestrial'];
$style = filter_input(INPUT_GET, 'style', FILTER_SANITIZE_STRING) ?? 'corporate';

if(!in_array($style, $allowed_styles)) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid style parameter']));
}

if(isset($_GET['debug'])) {
    die(json_encode([
        'status' => 'success',
        'api_key' => substr($api_key, 0, 5) . '...', // Partial key reveal
        'request' => $url
    ]));
}

$api_key = 'AIzaSyARRFGcO7LK9TqPA-wvLw2kEzRBooMMMVU'; // Rotate this!
$url = "https://www.googleapis.com/webfonts/v1/webfonts?key=$api_key&category=$style";

$response = file_get_contents($url);
if($response === FALSE) {
    http_response_code(500);
    die(json_encode(['error' => 'Failed to fetch fonts', 'details' => error_get_last()]));
}

// Add security headers
header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
header('X-Content-Type-Options: nosniff');

echo $response;
?>



