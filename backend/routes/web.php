<?php
use Illuminate\Support\Facades\Route;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

Route::get('/crawl-vnexpress', function () {
    $client = new Client();
    
    // 1. Gửi request lấy nội dung HTML của trang chủ VnExpress
    $response = $client->request('GET', 'https://vnexpress.net/tin-tuc-24h');
    $html = $response->getBody()->getContents();

    // 2. Khởi tạo Crawler để bóc tách HTML
    $crawler = new Crawler($html);

    // 3. Tìm các bài viết (thường nằm trong thẻ <article> với class 'item-news')
    $news = $crawler->filter('article.item-news')->each(function (Crawler $node) {
        // Lấy tiêu đề tin
        $title = $node->filter('h3.title-news > a')->count() > 0 
                    ? $node->filter('h3.title-news > a')->text() 
                    : null;

        // Lấy link bài viết
        $link = $node->filter('h3.title-news > a')->count() > 0 
                    ? $node->filter('h3.title-news > a')->attr('href') 
                    : null;

        // Lấy link ảnh (nằm trong thẻ img của class 'thumb-art')
        $image = $node->filter('div.thumb-art img')->count() > 0 
                    ? $node->filter('div.thumb-art img')->attr('data-src') ?? $node->filter('div.thumb-art img')->attr('src')
                    : null;

        if ($title && $link) {
            return [
                'title' => $title,
                'link' => $link,
                'image' => $image,
            ];
        }
    });

    // Loại bỏ các phần tử null và trả về JSON cho React dùng
    return response()->json(array_filter($news));
});
