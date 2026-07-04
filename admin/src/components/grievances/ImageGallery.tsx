import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ImageIcon, Clock, Maximize2 } from 'lucide-react';
import { isAfter, addHours } from 'date-fns';
import { Skeleton } from '../ui/SkeletonLoader';

interface ImageGalleryProps {
    grievance: {
        id: string;
        status: string;
        image_paths?: string[];
        created_at: string;
        updated_at: string;
    };
    overrideLabel?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ grievance, overrideLabel }) => {
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const processImages = async () => {
            setLoading(true);
            setExpired(false);

            const { status, image_paths, created_at, updated_at } = grievance;
            const normalizedStatus = status.toLowerCase();

            // Visibility Rules
            // REJECTED: no images should be shown.
            if (normalizedStatus === 'rejected') {
                setImages([]);
                setLoading(false);
                return;
            }

            if (!image_paths || image_paths.length === 0) {
                setImages([]);
                setLoading(false);
                return;
            }

            const now = new Date();
            const createdAtDate = new Date(created_at);
            const updatedAtDate = new Date(updated_at);

            let isExpired = false;
            let filteredImages: string[] = [];

            // OPEN: show student images.
            if (normalizedStatus === 'submitted') {
                filteredImages = image_paths.filter(p => p.includes('/student/'));
                // Note: No explicit window for OPEN in requirements, but auto-deletion exists.
                // We'll show images if they are in the list.
            }
            // IN PROGRESS: show student images only within the 24-hour window.
            else if (normalizedStatus === 'in-progress' || normalizedStatus === 'in progress') {
                filteredImages = image_paths.filter(p => p.includes('/student/'));

                // 24h window for student images - strictly from creation/upload
                const expiryTime = addHours(createdAtDate, 24);
                if (isAfter(now, expiryTime)) {
                    isExpired = true;
                }
            }
            // REOPENED: show student images (reopen proof)
            else if (normalizedStatus === 'reopened') {
                filteredImages = image_paths.filter(p => p.includes('/student/'));
                // No strict window yet for challenged evidence
            }
            // COMPLETED / RESOLVED: show staff images within the 72-hour window.
            else if (normalizedStatus === 'resolved' || normalizedStatus === 'completed') {
                filteredImages = image_paths.filter(p => p.includes('/staff/'));

                const expiryTime = addHours(updatedAtDate, 72);
                if (isAfter(now, expiryTime)) {
                    isExpired = true;
                }
            }

            if (isExpired) {
                setExpired(true);
                setImages([]);
            } else if (filteredImages.length > 0) {
                // Generate public URLs for valid images
                const urls = filteredImages.map(path => {
                    const { data } = supabase.storage.from('grievances').getPublicUrl(path);
                    return data.publicUrl;
                });
                setImages(urls);
            } else {
                setImages([]);
            }

            setLoading(false);
        };

        processImages();
    }, [grievance]);

    if (loading) {
        return (
            <div className="mt-6 space-y-3">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="aspect-square rounded-xl" />
                </div>
            </div>
        );
    }

    if (expired) {
        return (
            <div className="mt-6 px-4 py-3 rounded-xl bg-orange-50/50 border border-orange-100/50 flex items-center gap-3 text-orange-700">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold">Images Expired</p>
                    <p className="text-xs text-orange-600/80">The viewing window (24h/72h) for these attachments has passed.</p>
                </div>
            </div>
        );
    }

    if (images.length === 0) return null;

    return (
        <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {overrideLabel || `Attachments (${images.length})`}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((url: string, index: number) => (
                    <div
                        key={index}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-white/40 bg-white/20 backdrop-blur-sm cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                        onClick={() => window.open(url, '_blank')}
                    >
                        <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3">
                            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                                <Maximize2 className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageGallery;
