import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Flame, Leaf, Clock3 } from 'lucide-react';
import { publicMenuService, resolveMediaUrl } from '@/services/api';

export default function PublicMenu() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['public-categories'],
    queryFn: publicMenuService.getCategories,
  });

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['public-menu-items', categoryId, search],
    queryFn: () =>
      publicMenuService.getMenuItems({
        category_id: categoryId || undefined,
        search: search || undefined,
      }),
  });

  const featured = (menuItems || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#ffd8b2,_transparent_35%),radial-gradient(circle_at_bottom_left,_#f7c4c4,_transparent_35%),linear-gradient(180deg,_#fff7ef_0%,_#fff_40%,_#fff7ef_100%)] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl border border-orange-200/60 bg-white/80 backdrop-blur p-6 md:p-8 shadow-[0_20px_60px_-30px_rgba(255,110,38,0.45)]">
          <div className="flex items-center gap-2 text-orange-700 mb-3">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.16em] font-semibold">Digital Menu</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-orange-950">Freshly Prepared, Right Now</h1>
          <p className="text-orange-900/75 mt-3 max-w-2xl">
            Browse today&apos;s available dishes and discover chef favorites crafted for your table.
          </p>
        </div>

        {featured.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featured.map((item) => (
              <div key={`featured-${item.id}`} className="rounded-2xl border border-orange-200/60 bg-white/85 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-orange-700">Chef Pick</p>
                <p className="font-semibold text-orange-950 line-clamp-1">{item.name}</p>
                <p className="text-sm text-orange-800 mt-1">{item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        <Card className="border-orange-200/60 bg-white/85 backdrop-blur">
          <CardContent className="p-4 md:p-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-700/60" />
              <Input
                className="pl-10 border-orange-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={categoryId === null ? 'default' : 'outline'}
                onClick={() => setCategoryId(null)}
                className={categoryId === null ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-300 text-orange-900'}
              >
                All
              </Button>
              {categories?.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={categoryId === cat.id ? 'default' : 'outline'}
                  onClick={() => setCategoryId(cat.id)}
                  className={categoryId === cat.id ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-300 text-orange-900'}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-center text-orange-900/70">Loading menu...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems?.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full border-orange-200/60 bg-white/90 overflow-hidden shadow-[0_10px_35px_-25px_rgba(215,97,31,0.8)]">
                  <CardContent className="p-4 space-y-3">
                    {item.image_url && (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt={item.name}
                        className="w-full h-40 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-lg text-orange-950">{item.name}</h3>
                      <Badge className="bg-orange-600 hover:bg-orange-700">{item.price.toFixed(2)}</Badge>
                    </div>
                    <p className="text-sm text-orange-900/70 min-h-10">{item.description || 'Chef special'}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {item.is_vegetarian && <Badge variant="outline" className="gap-1"><Leaf className="h-3 w-3" />Veg</Badge>}
                      {item.is_spicy && <Badge variant="outline" className="gap-1"><Flame className="h-3 w-3" />Spicy</Badge>}
                      <Badge variant="secondary" className="gap-1"><Clock3 className="h-3 w-3" />{item.preparation_time} min</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
