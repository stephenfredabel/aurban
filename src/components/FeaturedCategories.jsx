import { Link }           from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { featuredCategories } from '../data/featuredCategories.js';

export default function FeaturedCategories() {
  const { t } = useTranslation();

  return (
    <section aria-label={t('home.browseCategory')}>
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="section-title">{t('home.browseCategory')}</h2>
      </div>

      <div className="px-4 scroll-x">
        <div className="flex gap-3 pb-2 w-max">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.href}
              className="flex flex-col items-center gap-2.5 w-20 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 rounded-2xl"
              aria-label={t(`categories.${cat.id}`, { defaultValue: cat.label })}
            >
              <div
                className={[
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl',
                  'transition-all duration-200 group-hover:scale-110 group-active:scale-95',
                  cat.bgColor || 'bg-brand-gray-soft',
                ].join(' ')}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-semibold leading-tight text-center text-brand-charcoal font-body">
                {t(`categories.${cat.id}`, { defaultValue: cat.label })}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}