import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertCircle, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false
}) => {
    const isMobile = useIsMobile();

    const handleOpenChange = (open: boolean) => {
        if (!open && !isLoading) {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!isLoading) {
            onConfirm();
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <Trash2 className="w-6 h-6 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
            case 'info':
                return <AlertCircle className="w-6 h-6 text-blue-400" />;
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-400" />;
            default:
                return <AlertTriangle className="w-6 h-6 text-red-400" />;
        }
    };

    const getButtonStyles = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700 text-white';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700 text-white';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            default:
                return 'bg-red-600 hover:bg-red-700 text-white';
        }
    };

    const content = (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                {getIcon()}
                <div className="flex-1">
                    {title && (
                        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    )}
                    <p className="text-gray-400 leading-relaxed">{message}</p>
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 border-white/20 text-white hover:bg-white/5 disabled:opacity-50"
                >
                    {cancelText}
                </Button>
                <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={`flex-1 ${getButtonStyles()} disabled:opacity-50`}
                >
                    {isLoading ? 'Processing...' : confirmText}
                </Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={handleOpenChange}>
                <DrawerContent className="bg-background border-border max-h-[90vh]">
                    <div className="p-6">
                        {content}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-background border-border max-w-md">
                {content}
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationModal;