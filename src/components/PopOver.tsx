import { OverlayTrigger, Popover } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';

export default function PopoverButton() {
  const { t } = useTranslation('common');

  const popover = (
    <Popover id="popover-basic">
      <Popover.Header as="h3">{t('Data Source Title')}</Popover.Header>
      <Popover.Body>
        {t('Data Source Description')}{' '}
        <p>
          <a href="http://codich1.ibict.br:8086/data-source-info" target="_blank" rel="noreferrer">
            {t('click here')}
          </a>
          .
        </p>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="focus" placement="bottom" overlay={popover}>
      <button type="button" className="custom-popover-btn">
        <span className="mobile-hidden">{t('Title Popover')}?</span>
        <i className="bi bi-question-circle"></i>
      </button>
    </OverlayTrigger>
  );
}
