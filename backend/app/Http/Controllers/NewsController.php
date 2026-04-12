<?php

namespace App\Http\Controllers;

use App\Models\News;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class NewsController extends Controller
{
    // ✅ API cho React
    public function index()
    {
        // 👉 chỉ crawl nếu DB trống
        if (News::count() === 0) {
            $this->crawl();
        }

        return response()->json(
            News::latest()->limit(50)->get()
        );
    }

    // ✅ Crawl
    public function crawl()
    {
        $categories = [
            'Thời sự' => 'https://vnexpress.net/thoi-su',
            'Thế giới' => 'https://vnexpress.net/the-gioi',
            'Kinh doanh' => 'https://vnexpress.net/kinh-doanh',
            'Thể thao' => 'https://vnexpress.net/the-thao',
            'Giải trí' => 'https://vnexpress.net/giai-tri'
        ];

        foreach ($categories as $name => $url) {
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0'
                ])->timeout(5)->get($url);

                $crawler = new Crawler($response->body());

                $crawler->filter('article.item-news')->slice(0, 6)
                    ->each(function ($node) use ($name) {

                        $titleNode = $node->filter('h3.title-news > a');
                        if ($titleNode->count() === 0) return;

                        $imgNode = $node->filter('div.thumb-art img');

                        $image = $imgNode->count() > 0
                            ? ($imgNode->attr('data-src')
                                ?? $imgNode->attr('data-original')
                                ?? $imgNode->attr('src'))
                            : null;

                        if ($image && str_starts_with($image, '//')) {
                            $image = 'https:' . $image;
                        }

                        if (!$image) {
                            $image = 'https://via.placeholder.com/400x250';
                        }

                        News::updateOrCreate(
                            ['link' => $titleNode->attr('href')],
                            [
                                'title' => trim($titleNode->text()),
                                'image' => $image,
                                'category' => $name
                            ]
                        );
                    });

            } catch (\Exception $e) {
                continue;
            }
        }

        return response()->json(['message' => 'Crawl done']);
    }
}