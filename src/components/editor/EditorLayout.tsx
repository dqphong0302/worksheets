import React from 'react';

interface EditorLayoutProps {
    toolbar: React.ReactNode;
    sidebar: React.ReactNode;
    preview: React.ReactNode;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
    toolbar,
    sidebar,
    preview,
}) => {
    return (
        <div className="editor-layout">
            {toolbar}
            <div className="editor-sidebar">{sidebar}</div>
            <div className="editor-preview">{preview}</div>
        </div>
    );
};
