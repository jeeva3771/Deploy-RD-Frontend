import React from 'react';
import { getFileNamev2 } from '../../../../utils/helper/FilenameURL';

const IngestFilesStage = ({
    job,
    onUploadClick,
    onFileUpload,
    fileInputRef,
    onDownload,
    onDelete,
    isSalesPerson
}) => {
    const [selectedTag, setSelectedTag] = React.useState('');

    // Get material group names from job
    const materialGroups = job.job_sheet?.materialprocess?.map(group => group.material_group_name) || [];

    // Define standard tags
    const standardTags = [
        { label: 'Artwork PDF', value: 'artwork_pdf' },
        { label: 'Artwork CDR', value: 'artwork_cdr' },
        { label: 'Note', value: 'note' },
        { label: 'Logo', value: 'logo' },
        { label: 'Signed Image', value: 'signed_image' },
    ];

    // Combine standard tags with material group tags
    const allTags = [
        ...standardTags,
        ...materialGroups.map(name => ({ label: `Section: ${name}`, value: name }))
    ];

    // Format artwork files from BOM (PDF and CDR)
    const artworkFiles = [];
    const pdfUrl = job.bom_id?.artwork_pdf;
    const cdrUrl = job.bom_id?.artwork_cdr;

    if (pdfUrl) {
        artworkFiles.push({
            name: getFileNamev2(pdfUrl),
            url: pdfUrl,
            isUploaded: true,
            type: 'PDF'
        });
    }
    if (cdrUrl) {
        artworkFiles.push({
            name: getFileNamev2(cdrUrl),
            url: cdrUrl,
            isUploaded: true,
            type: 'CDR'
        });
    }

    // Format additional files uploaded from DTP
    const sourceAdditionalFiles = job.additional_files?.length > 0 ? job.additional_files : (job.sample_order_id?.additional_files || []);

    const additionalFiles = sourceAdditionalFiles.length > 0
        ? sourceAdditionalFiles.map(item => {
            const fileUrl = typeof item === 'string' ? item : item.file_url;
            const tagName = typeof item === 'string' ? null : item.tag_name;
            const fileId = typeof item === 'string' ? null : item._id;
            return {
                name: getFileNamev2(fileUrl),
                url: fileUrl,
                isUploaded: !!fileUrl,
                tag: tagName,
                _id: fileId
            };
        })
        : [];

    // Combine both arrays
    const allFiles = [...artworkFiles, ...additionalFiles];
    console.log("allFiles", allFiles)

    const handleFileChange = (e) => {
        onFileUpload(e, selectedTag);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 font-primary">Ingest Files</h2>

            {/* Upload Section */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6">
                <div className="flex flex-col items-center text-center">
                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-400 mb-3"></i>
                    <p className="text-sm text-slate-600 mb-3 font-primary">Upload additional artwork files</p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-primary">Select Tag/Category</label>
                        <select
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-primary"
                        >
                            <option value="">Select Tag</option>
                            {allTags.map((tag, idx) => (
                                <option key={idx} value={tag.value}>{tag.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={onUploadClick}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors font-primary w-full shadow-sm"
                        >
                            <i className="fa-solid fa-upload mr-2"></i>
                            Choose Files
                        </button>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="*/*"
                    multiple
                />
            </div>

            {/* Existing Files List */}
            {allFiles.length > 0 ? (
                <div className="space-y-3">
                    {allFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="text-base font-medium text-slate-900 font-primary truncate max-w-[400px]" title={file.name}>{file.name}</div>
                                {file.type ? <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${file.type === 'PDF' ? 'bg-red-100 text-red-600' :
                                    file.type === 'CDR' ? 'bg-green-100 text-green-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                    {file.type}
                                </span> : file.tag ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-600">
                                        {file.tag}
                                    </span>
                                ) : null}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onDownload(file)}
                                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors font-primary border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-download"></i>
                                </button>

                                {!(file.type === 'PDF' || file.type === 'CDR') && !isSalesPerson && (
                                    <button
                                        onClick={() => onDelete(file)}
                                        className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors font-primary border border-red-200 rounded hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-400 text-sm font-primary">
                    <i className="fa-regular fa-folder-open text-3xl mb-2"></i>
                    <p>No files uploaded yet</p>
                </div>
            )}
        </div>
    );
};

export default IngestFilesStage;
