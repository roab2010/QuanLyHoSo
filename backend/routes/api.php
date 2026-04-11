<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;

use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Các route cho Category
Route::apiResource('categories', CategoryController::class);

// Xử lý riêng cho Project (Viết Route PUT đè lên trước Resource)
Route::put('projects/{id}', [ProjectController::class, 'update']); 
Route::apiResource('projects', ProjectController::class);

// Route để cào tin tức từ VnExpress
Route::get('/news', function () {

    return Cache::remember('news_cache', 300, function () {

        $client = new Client([
            'timeout' => 10,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0'
            ]
        ]);

        $categories = [
            'Thời sự' => 'https://vnexpress.net/thoi-su',
            'Thế giới' => 'https://vnexpress.net/the-gioi',
            'Kinh doanh' => 'https://vnexpress.net/kinh-doanh',
            'Thể thao' => 'https://vnexpress.net/the-thao',
            'Giải trí' => 'https://vnexpress.net/giai-tri'
        ];

        $allNews = [];

        foreach ($categories as $name => $url) {
            try {
                $response = $client->request('GET', $url);
                $crawler = new Crawler($response->getBody()->getContents());

                $crawler->filter('article.item-news')->slice(0, 6)
                    ->each(function (Crawler $node) use (&$allNews, $name) {

                        $titleNode = $node->filter('h3.title-news > a');
                        if ($titleNode->count() === 0) return;

                        $imgNode = $node->filter('div.thumb-art img');

                        // ✅ Lấy ảnh chuẩn
                        $image = null;
                        if ($imgNode->count() > 0) {
                            $image = $imgNode->attr('data-src')
                                ?? $imgNode->attr('data-original')
                                ?? $imgNode->attr('src');
                        }

                        // ✅ Fix thiếu https
                        if ($image && str_starts_with($image, '//')) {
                            $image = 'https:' . $image;
                        }

                        // ✅ fallback
                        if (!$image) {
                            $image = 'https://via.placeholder.com/400x250';
                        }

                        $allNews[] = [
                            'title' => $titleNode->text(),
                            'link' => $titleNode->attr('href'),
                            'image' => $image,
                            'category' => $name
                        ];
                    });

            } catch (\Exception $e) {
                continue;
            }
        }

        return $allNews;
    });
});

