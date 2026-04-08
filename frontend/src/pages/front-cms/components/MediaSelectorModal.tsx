import { Modal } from '../../../components/ui/modal';
import MediaBrowser from './MediaBrowser';
import { CmsMedia } from '../../../services/cms.service';

interface MediaSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (media: CmsMedia) => void;
    title?: string;
}

const MediaSelectorModal = ({ isOpen, onClose, onSelect, title = "Select Media" }: MediaSelectorModalProps) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={title}
            size="full"
            className="h-[90vh]"
        >
            <div className="h-full flex flex-col">
                <MediaBrowser 
                    selectionMode={true} 
                    onSelect={(media) => {
                        onSelect(media);
                        onClose();
                    }} 
                    allowDelete={false}
                />
            </div>
        </Modal>
    );
};

export default MediaSelectorModal;
