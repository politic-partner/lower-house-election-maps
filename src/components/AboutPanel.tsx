import { useEffect } from 'react';
import IconCross from '../assets/icons/cross.svg?react';

export function AboutPanel({ showAboutPanel, setShowAboutPanel }: { showAboutPanel: boolean, setShowAboutPanel: (show: boolean) => void }) {
    if (!showAboutPanel) {
        return <></>;
    }
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowAboutPanel(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 z-10 w-screen">
                <div className="flex items-end justify-center text-center">
                    <div className="h-dvh w-full bg-white text-left overflow-y-scroll">
                        <div className="relative bg-white px-4">
                            <div className="sticky top-0 pt-4 z-10 bg-white bg-opacity-80 overflow-hidden">
                                <h1 className="text-3xl font-extrabold leading-none tracking-tight text-gray-900">衆院選2024候補者マップ</h1>
                                <button
                                    type="button"
                                    className="fixed top-4 right-4 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                                    onClick={() => setShowAboutPanel(false)}
                                >
                                    <IconCross className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>

                            <h3 className="mt-2 text-2xl font-semibold text-gray-900">データ引用元</h3>
                            <p className="my-4">
                                <ul className="space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://www.nhk.or.jp/senkyo/database/shugiin/">衆議院選挙2024特設サイト | NHK
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html">行政区域データ: データ基準年 2024年（令和6年）版 | 国土数値情報ダウンロードサイト
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル一覧 | 国土地理院
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://qiita.com/uedayou/items/806ed80a45ec9855c554">住所LODから行政区画のGeoJSONファイルを作成する方法 | Qiita
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://github.com/smartnews-smri/japan-topography">市区町村・選挙区 地形データ | GitHub
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="http://dailycult.blogspot.com/2021/10/2021.html">【衆院選2021】総力特集・カルト候補ぜんぶ載せ！ | やや日刊カルト新聞
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://clearing-house.org/?p=6069">政治資金パーティー収入　裏金はおいくらでしたか？（裏金国会議員一覧） | 情報公開クリアリングハウス
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://news.ntv.co.jp/pages/uragane">【一覧】自民党国会議員の"裏金"リスト 88人 | 日テレNEWS
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://www.tokyo-np.co.jp/article/200852">【自民党、旧統一教会と接点ある国会議員は179人　うち121人を公表　選挙支援の依頼は2人 | 東京新聞
                                    </a></li>
                                </ul>
                            </p>

                            <h3 className="mt-2 text-2xl font-semibold text-gray-900">利用サービス</h3>
                            <p className="my-4">
                                <ul className="space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://github.com">GitHub
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages">GitHub Pages | GitHub
                                    </a></li>
                                    <li><a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer"
                                        href="https://www.perplexity.ai/">Perplexity AI
                                    </a></li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
