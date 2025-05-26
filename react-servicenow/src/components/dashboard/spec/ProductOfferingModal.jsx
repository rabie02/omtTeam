import React from 'react';
import { Modal, List } from 'antd';

function ProductOfferingModal({ open, setOpen, offerings, spec }) {
  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title={`Offres liées à : ${spec?.display_name || spec?.name}`}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      {offerings.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={offerings}
          renderItem={item => (
            <List.Item key={item.sys_id}>
              <List.Item.Meta
                title={item.name}
                description={`Statut : ${item.status || 'N/A'}`}
              />
              <p>{item.description || 'Pas de description'}</p>
            </List.Item>
          )}
        />
      ) : (
        <p>Aucune offre liée trouvée.</p>
      )}
    </Modal>
  );
}

export default ProductOfferingModal;
