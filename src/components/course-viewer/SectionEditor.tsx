import { Button } from '../../components/ui/Button';

function SectionEditor({ currentSection, progress, validateSection, ...props }) {
  const isSectionValidated = progress?.completedSections?.includes(currentSection.id);
  return (
    <div>
      {/* ... contenu de la section ... */}
      <Button onClick={validateSection} disabled={isSectionValidated}>
        {isSectionValidated ? 'Section validée' : 'Valider la section'}
      </Button>
    </div>
  );
} 