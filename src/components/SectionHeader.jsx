import { Link }           from 'react-router-dom';
import { ChevronRight }   from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SectionHeader({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  seeAllTo,
  seeAllLabel,
  className = '',
}) {
  const { t } = useTranslation();

  const displayTitle    = titleKey    ? t(titleKey)    : title;
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle;
  const displaySeeAll   = seeAllLabel || t('common.seeAll');

  return (
    <div className={`flex items-end justify-between mb-4 ${className}`}>
      <div>
        <h2 className="leading-tight section-title">{displayTitle}</h2>
        {displaySubtitle && (
          <p className="text-xs text-gray-400 mt-0.5 font-body">{displaySubtitle}</p>
        )}
      </div>

      {seeAllTo && (
        <Link
          to={seeAllTo}
          className="flex items-center gap-0.5 text-sm font-semibold text-brand-gold hover:text-brand-gold-dark transition-colors shrink-0 ml-4"
          aria-label={`${displaySeeAll}: ${displayTitle}`}
        >
          {displaySeeAll}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}