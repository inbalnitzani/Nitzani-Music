import React, { useState, useEffect } from 'react';
import TagList from './TageList';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';

interface ManageSiteProps {
  authors: string[];
  artists: string[];
  keywords: string[];
  onSave?: () => void; // Callback to refresh data in parent
}

interface Song {
  id: string;
  title: string;
  artists: string[];
  authors: string[];
  keywords: string[];
}

const ManageSite: React.FC<ManageSiteProps> = ({ authors, artists, keywords, onSave }) => {
    const [deletedAuthors, setDeletedAuthors] = useState<string[]>([]);
    const [deletedArtists, setDeletedArtists] = useState<string[]>([]);
    const [deletedKeywords, setDeletedKeywords] = useState<string[]>([]);
    const [newAuthors, setNewAuthors] = useState<string[]>([]);
    const [newArtists, setNewArtists] = useState<string[]>([]);
    const [newKeywords, setNewKeywords] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [newAuthorInput, setNewAuthorInput] = useState('');
    const [newArtistInput, setNewArtistInput] = useState('');
    const [newKeywordInput, setNewKeywordInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmData, setDeleteConfirmData] = useState<{
        type: 'author' | 'artist' | 'keyword';
        item: string;
        affectedSongs: Song[];
    } | null>(null);

    // Reset all state when props change
    useEffect(() => {
        setDeletedAuthors([]);
        setDeletedArtists([]);
        setDeletedKeywords([]);
        setNewAuthors([]);
        setNewArtists([]);
        setNewKeywords([]);
        setNewAuthorInput('');
        setNewArtistInput('');
        setNewKeywordInput('');
    }, [authors, artists, keywords]);

    const exportToPDF = (songs: Song[], tagType: string, tagName: string) => {
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(16);
        doc.text(`Delete Confirmation Report`, 20, 20);
        
        // Subtitle
        doc.setFontSize(12);
        doc.text(`Tag to be deleted: ${tagType} "${tagName}"`, 20, 30);
        doc.text(`Affected songs: ${songs.length}`, 20, 40);
        
        // Create simple table manually
        let yPosition = 60;
        const pageHeight = 280;
        const lineHeight = 8;
        
        songs.forEach((song, index) => {
            // Check if we need a new page
            if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 20;
            }
            
            // Song title
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${song.title}`, 20, yPosition);
            yPosition += lineHeight;
            
            // Song details
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Artists: ${song.artists.join(', ')}`, 25, yPosition);
            yPosition += lineHeight;
            doc.text(`Authors: ${song.authors.join(', ')}`, 25, yPosition);
            yPosition += lineHeight;
            doc.text(`Keywords: ${song.keywords.join(', ')}`, 25, yPosition);
            yPosition += lineHeight + 5; // Extra space between songs
        });
        
        // Footer
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition + 10);
        doc.text(`Total songs affected: ${songs.length}`, 20, yPosition + 20);
        
        // Save the PDF
        doc.save(`delete-confirmation-${tagType}-${tagName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
    };

    const checkAffectedSongs = async (type: 'author' | 'artist' | 'keyword', item: string) => {
        try {
            let query;
            switch (type) {
                case 'author':
                    query = supabase.from('songs').select('id, title, artists, authors, keywords').contains('authors', [item]);
                    break;
                case 'artist':
                    query = supabase.from('songs').select('id, title, artists, authors, keywords').contains('artists', [item]);
                    break;
                case 'keyword':
                    query = supabase.from('songs').select('id, title, artists, authors, keywords').contains('keywords', [item]);
                    break;
            }
            
            const { data: songs } = await query;
            return songs || [];
        } catch (error) {
            console.error('Error checking affected songs:', error);
            return [];
        }
    };

    const handleDeleteWithConfirmation = async (type: 'author' | 'artist' | 'keyword', item: string) => {
        const affectedSongs = await checkAffectedSongs(type, item);
        
        if (affectedSongs.length > 0) {
            setDeleteConfirmData({ type, item, affectedSongs });
            setShowDeleteConfirm(true);
        } else {
            // No affected songs, proceed with deletion
            confirmDelete(type, item);
        }
    };

    const confirmDelete = (type: 'author' | 'artist' | 'keyword', item: string) => {
        switch (type) {
            case 'author':
                setDeletedAuthors(prev => [...prev, item]);
                break;
            case 'artist':
                setDeletedArtists(prev => [...prev, item]);
                break;
            case 'keyword':
                setDeletedKeywords(prev => [...prev, item]);
                break;
        }
        setShowDeleteConfirm(false);
        setDeleteConfirmData(null);
    };

    const addNewAuthor = () => {
        if (newAuthorInput.trim() && !authors.includes(newAuthorInput.trim()) && !newAuthors.includes(newAuthorInput.trim())) {
            setNewAuthors(prev => [...prev, newAuthorInput.trim()]);
            setNewAuthorInput('');
        }
    };

    const addNewArtist = () => {
        if (newArtistInput.trim() && !artists.includes(newArtistInput.trim()) && !newArtists.includes(newArtistInput.trim())) {
            setNewArtists(prev => [...prev, newArtistInput.trim()]);
            setNewArtistInput('');
        }
    };

    const addNewKeyword = () => {
        if (newKeywordInput.trim() && !keywords.includes(newKeywordInput.trim()) && !newKeywords.includes(newKeywordInput.trim())) {
            setNewKeywords(prev => [...prev, newKeywordInput.trim()]);
            setNewKeywordInput('');
        }
    };

    const handleSaveAuthors = async () => {
        if (deletedAuthors.length === 0 && newAuthors.length === 0) {
            alert('No changes to save');
            return;
        }
        
        setIsSaving(true);
        try {
            // Delete removed authors
            if (deletedAuthors.length > 0) {
                await supabase.from('authors').delete().in('name', deletedAuthors);
            }
            
            // Add new authors
            if (newAuthors.length > 0) {
                await supabase.from('authors').insert(newAuthors.map(name => ({ name })));
            }
            
            setDeletedAuthors([]);
            setNewAuthors([]);
            alert('Authors saved successfully!');
            onSave?.(); // Notify parent to refresh data
        } catch (error) {
            console.error('Error saving authors:', error);
            alert('Failed to save authors');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveArtists = async () => {
        if (deletedArtists.length === 0 && newArtists.length === 0) {
            alert('No changes to save');
            return;
        }
        
        setIsSaving(true);
        try {
            // Delete removed artists
            if (deletedArtists.length > 0) {
                await supabase.from('artists').delete().in('name', deletedArtists);
            }
            
            // Add new artists
            if (newArtists.length > 0) {
                await supabase.from('artists').insert(newArtists.map(name => ({ name })));
            }
            
            setDeletedArtists([]);
            setNewArtists([]);
            alert('Artists saved successfully!');
            onSave?.(); // Notify parent to refresh data
        } catch (error) {
            console.error('Error saving artists:', error);
            alert('Failed to save artists');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveKeywords = async () => {
        if (deletedKeywords.length === 0 && newKeywords.length === 0) {
            alert('No changes to save');
            return;
        }
        
        setIsSaving(true);
        try {
            // Delete removed keywords
            if (deletedKeywords.length > 0) {
                await supabase.from('keywords').delete().in('name', deletedKeywords);
            }
            
            // Add new keywords
            if (newKeywords.length > 0) {
                await supabase.from('keywords').insert(newKeywords.map(name => ({ name })));
            }
            
            setDeletedKeywords([]);
            setNewKeywords([]);
            alert('Keywords saved successfully!');
            onSave?.(); // Notify parent to refresh data
        } catch (error) {
            console.error('Error saving keywords:', error);
            alert('Failed to save keywords');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deleteConfirmData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">
                            Confirm Delete: {deleteConfirmData.item}
                        </h3>
                        <p className="text-red-600 mb-4">
                            This {deleteConfirmData.type} is used in {deleteConfirmData.affectedSongs.length} song(s):
                        </p>
                        <div className="max-h-60 overflow-y-auto border rounded p-3 mb-4">
                            {deleteConfirmData.affectedSongs.map(song => (
                                <div key={song.id} className="mb-2 p-2 bg-gray-50 rounded">
                                    <div className="font-medium">{song.title}</div>
                                    <div className="text-sm text-gray-600">
                                        Artists: {song.artists.join(', ')}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Authors: {song.authors.join(', ')}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Keywords: {song.keywords.join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => exportToPDF(deleteConfirmData.affectedSongs, deleteConfirmData.type, deleteConfirmData.item)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Export to PDF
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmData(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmDelete(deleteConfirmData.type, deleteConfirmData.item)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Authors:</h3>
                    <button 
                        onClick={handleSaveAuthors}
                        disabled={isSaving || (deletedAuthors.length === 0 && newAuthors.length === 0)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : `Save Authors (${deletedAuthors.length} deleted, ${newAuthors.length} added)`}
                    </button>
                </div>
                <div className="border border-gray-300 rounded-md p-3 h-24 bg-white overflow-y-auto mb-2">
                    <TagList 
                        items={authors} 
                        colorClass="bg-green-100 text-green-800" 
                        deleteable={true}
                        onDelete={(deletedItem) => handleDeleteWithConfirmation('author', deletedItem)}
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newAuthorInput}
                        onChange={(e) => setNewAuthorInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNewAuthor()}
                        placeholder="Add new author..."
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button 
                        onClick={addNewAuthor}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
                {newAuthors.length > 0 && (
                    <div className="mt-2">
                        <span className="text-sm text-gray-600">New authors to add:</span>
                        <TagList 
                            items={newAuthors} 
                            colorClass="bg-yellow-100 text-yellow-800" 
                            deleteable={true}
                            onDelete={(deletedItem) => setNewAuthors(prev => prev.filter(item => item !== deletedItem))}
                        />
                    </div>
                )}
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Artists:</h3>
                    <button 
                        onClick={handleSaveArtists}
                        disabled={isSaving || (deletedArtists.length === 0 && newArtists.length === 0)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : `Save Artists (${deletedArtists.length} deleted, ${newArtists.length} added)`}
                    </button>
                </div>
                <div className="border border-gray-300 rounded-md p-3 h-24 bg-white overflow-y-auto mb-2">
                    <TagList 
                        items={artists} 
                        colorClass="bg-blue-100 text-blue-800" 
                        deleteable={true}
                        onDelete={(deletedItem) => handleDeleteWithConfirmation('artist', deletedItem)}
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newArtistInput}
                        onChange={(e) => setNewArtistInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNewArtist()}
                        placeholder="Add new artist..."
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button 
                        onClick={addNewArtist}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
                {newArtists.length > 0 && (
                    <div className="mt-2">
                        <span className="text-sm text-gray-600">New artists to add:</span>
                        <TagList 
                            items={newArtists} 
                            colorClass="bg-yellow-100 text-yellow-800" 
                            deleteable={true}
                            onDelete={(deletedItem) => setNewArtists(prev => prev.filter(item => item !== deletedItem))}
                        />
                    </div>
                )}
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Keywords:</h3>
                    <button 
                        onClick={handleSaveKeywords}
                        disabled={isSaving || (deletedKeywords.length === 0 && newKeywords.length === 0)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : `Save Keywords (${deletedKeywords.length} deleted, ${newKeywords.length} added)`}
                    </button>
                </div>
                <div className="border border-gray-300 rounded-md p-3 h-24 bg-white overflow-y-auto mb-2">
                    <TagList 
                        items={keywords} 
                        colorClass="bg-pink-100 text-pink-800" 
                        deleteable={true}
                        onDelete={(deletedItem) => handleDeleteWithConfirmation('keyword', deletedItem)}
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNewKeyword()}
                        placeholder="Add new keyword..."
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button 
                        onClick={addNewKeyword}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
                {newKeywords.length > 0 && (
                    <div className="mt-2">
                        <span className="text-sm text-gray-600">New keywords to add:</span>
                        <TagList 
                            items={newKeywords} 
                            colorClass="bg-yellow-100 text-yellow-800" 
                            deleteable={true}
                            onDelete={(deletedItem) => setNewKeywords(prev => prev.filter(item => item !== deletedItem))}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageSite;