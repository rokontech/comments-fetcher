'use client'

import { useState, useEffect } from 'react'

interface Comment {
  path: string
  body: string
  line?: number
  user: {
    login: string
  }
}

export default function Home() {
  const [token, setToken] = useState('')
  const [prUrl, setPrUrl] = useState('')
  const [saveToken, setSaveToken] = useState(false)
  const [tokenSaved, setTokenSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [prInfo, setPrInfo] = useState({ owner: '', repo: '', prNumber: '' })
  const [showHelp, setShowHelp] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Check if token is already saved
    checkTokenStatus()
  }, [])



  const checkTokenStatus = async () => {
    try {
      const res = await fetch('/api/auth/token')
      const data = await res.json()
      if (data.hasToken) {
        setTokenSaved(true)
        setSaveToken(true)
        // Don't load the actual token value for security
        setToken('••••••••••••••••')
      }
    } catch (err) {
      console.error('Error checking token status:', err)
    }
  }

  const handleSaveToken = async (newTokenValue?: string) => {
    const tokenToSave = newTokenValue || token

    if (!saveToken) {
      // Unchecking - delete token
      try {
        await fetch('/api/auth/token', { method: 'DELETE' })
        setTokenSaved(false)
        setToken('')
      } catch (err) {
        console.error('Error deleting token:', err)
      }
      return
    }

    // Saving token
    if (!tokenToSave || tokenToSave === '••••••••••••••••') {
      alert('Please enter a token first before saving')
      setSaveToken(false)
      return
    }

    try {
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToSave }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save token')
      }

      setTokenSaved(true)
      setToken('••••••••••••••••') // Hide actual token
    } catch (err: any) {
      alert(err.message || 'Failed to save token')
      setSaveToken(false)
    }
  }

  const clearSavedToken = async () => {
    if (confirm('Are you sure you want to clear the saved token?')) {
      try {
        await fetch('/api/auth/token', { method: 'DELETE' })
        setTokenSaved(false)
        setSaveToken(false)
        setToken('')
      } catch (err) {
        console.error('Error clearing token:', err)
      }
    }
  }

  const fetchComments = async () => {
    setError('')
    setComments([])

    if (!prUrl) {
      setError('Please enter a pull request URL')
      return
    }

    // Parse URL
    const prMatch = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/)
    if (!prMatch) {
      setError('Invalid URL format. Expected: https://github.com/owner/repo/pull/123')
      return
    }

    const [, owner, repo, prNumber] = prMatch
    setPrInfo({ owner, repo, prNumber })

    setLoading(true)

    try {
      const res = await fetch('/api/github/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, prNumber }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch comments')
      }

      if (data.comments.length === 0) {
        setError('No comments found')
        return
      }

      setComments(data.comments)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }

  const toggleComment = (index: number) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedComments(newExpanded)
  }

  const downloadComments = () => {
    if (comments.length === 0) {
      alert('No comments to download')
      return
    }

    const { owner, repo, prNumber } = prInfo

    let content = `# comments Review Comments\n\n`
    content += `**Repository:** ${owner}/${repo}\n`
    content += `**Pull Request:** #${prNumber}\n`
    content += `**Total Comments:** ${comments.length}\n`
    content += `**Generated:** ${new Date().toLocaleString()}\n\n`
    content += `---\n\n`
    content += `## Instructions for AI\n\n`
    content += `Please review the following comments suggestions and provide implementation guidance or code fixes for each item.\n\n`
    content += `---\n\n`

    comments.forEach((comment, index) => {
      content += `## ${index + 1}. ${comment.path}\n\n`
      content += `**File:** \`${comment.path}\`\n\n`

      if (comment.line) {
        content += `**Line:** ${comment.line}\n\n`
      }

      content += `**comments Suggestion:**\n\n`
      content += `${comment.body}\n\n`
      content += `**Action Required:**\n`
      content += `Please provide a code solution or implementation guidance for this suggestion.\n\n`
      content += `---\n\n`
    })

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comments-comments-${owner}-${repo}-pr${prNumber}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const escapeHtml = (text: string) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  return (
    <div className="page">
      <div className="container">
        <div className="branding">
          <div className="logo">Comments Fetcher Tool</div>
          <h1 className="product-name">comments-fetcher</h1>
          <p className="description">
            Extract and organize comments suggestions from your GitHub pull requests in one clean view.
          </p>
          <a 
            href="https://github.com/rokontech/comments-fetcher" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
            aria-label="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        <div className="form-card">
          <div className="input-group">
            <label className="input-label" htmlFor="token">
              GitHub Token
              <span className="input-hint">Personal access token with repo scope</span>
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => {
                const newValue = e.target.value
                setToken(newValue)
                // Auto-save if checkbox is checked and token is valid
                if (saveToken && newValue && newValue !== '••••••••••••••••' && (newValue.startsWith('ghp_') || newValue.startsWith('github_pat_'))) {
                  handleSaveToken(newValue)
                }
              }}
              placeholder={tokenSaved ? "Token saved (enter new token to update)" : "ghp_xxxxxxxxxxxxxxxxxxxx"}
              autoComplete="off"
              spellCheck="false"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  document.getElementById('prUrl')?.focus()
                }
              }}
            />
            <div className="token-actions">
              <div className="save-token-wrapper">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="saveToken"
                    checked={saveToken}
                    onChange={(e) => {
                      setSaveToken(e.target.checked)
                      if (e.target.checked) {
                        handleSaveToken()
                      } else {
                        handleSaveToken()
                      }
                    }}
                  />
                  <span className="checkbox-label">Save token securely</span>
                </label>
                {tokenSaved && (
                  <span className="token-saved-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Saved
                  </span>
                )}
              </div>
              {tokenSaved && (
                <button type="button" className="clear-token-btn" onClick={clearSavedToken}>
                  Clear saved token
                </button>
              )}
            </div>
            <button type="button" className={`help-toggle ${showHelp ? 'active' : ''}`} onClick={() => setShowHelp(!showHelp)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              How to get a GitHub token
            </button>
            <div className={`help-content ${showHelp ? 'show' : ''}`}>
              <div className="help-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Create a GitHub Personal Access Token
              </div>
              <ol className="help-steps">
                <li className="help-step">Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="help-link">GitHub Token Settings</a></li>
                <li className="help-step">Click &quot;Generate new token&quot; → &quot;Generate new token (classic)&quot;</li>
                <li className="help-step">Give it a descriptive name like &quot;comments Fetcher&quot;</li>
                <li className="help-step">Select the <strong>repo</strong> scope (full control of private repositories)</li>
                <li className="help-step">For organization repos, you may also need <strong>read:org</strong> scope</li>
                <li className="help-step">Click &quot;Generate token&quot; at the bottom and copy it</li>
              </ol>
              <div className="help-note" style={{ borderLeftColor: '#f59e0b', background: '#fffbeb' }}>
                <strong style={{ color: '#d97706' }}>For Organization Repositories:</strong><br />
                If your organization uses SAML SSO: Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="help-link">Token Settings</a> → Click &quot;Configure SSO&quot; next to your token → Authorize it for your organization.
              </div>
              <div className="help-note">
                <strong>Security:</strong> Your token is stored securely on the server in an encrypted session cookie. It never leaves the server and is only used to make GitHub API requests server-side.
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="prUrl">
              Pull Request URL
            </label>
            <input
              type="text"
              id="prUrl"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              spellCheck="false"
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchComments()
              }}
            />
          </div>

          <button className="btn" id="fetchBtn" onClick={fetchComments} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Fetching...
              </>
            ) : (
              <>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Fetch Comments
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="message message-error">{error}</div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div className="loading-text">Searching for comments...</div>
            {prInfo.owner && (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                Fetching from: {prInfo.owner}/{prInfo.repo}/pull/{prInfo.prNumber}
              </div>
            )}
          </div>
        )}

        {comments.length > 0 && (
          <div className="results">
            <div className="results-header">
              <div className="results-info">
                <div className="results-title">Review Comments</div>
                <div className="results-count">
                  {comments.length} item{comments.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button className="download-btn" onClick={downloadComments}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Comments
              </button>
            </div>

            {comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <div className="comment-header-clickable" onClick={() => toggleComment(index)}>
                  <div className="comment-meta">
                    <div className="comment-number">{index + 1}</div>
                    <div className="file-path">{escapeHtml(comment.path)}</div>
                  </div>
                  <svg
                    className={`collapse-icon ${expandedComments.has(index) ? '' : 'collapsed'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <div className={`suggestion-section ${expandedComments.has(index) ? '' : 'collapsed'}`}>
                  <div className="suggestion-label">Suggestion</div>
                  <div className="suggestion-text">{escapeHtml(comment.body)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buy Me a Coffee Section */}
        <div className="support-section">
          <a href="https://www.buymeacoffee.com/rokontech" target="_blank" rel="noopener noreferrer">
            <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style={{ height: '60px', width: '217px' }} />
          </a>
        </div>

        {/* Privacy Disclaimer */}
        <div className="privacy-disclaimer">
          <p>
            <strong>Privacy & Disclaimer:</strong> This website does not save, store, or log any of your GitHub tokens, 
            commits, or repository data. Tokens are stored securely in encrypted session cookies on your device only 
            and are used solely to fetch comments from GitHub&apos;s API. You are solely responsible for 
            the security and use of your GitHub tokens. Use this tool at your own risk.
          </p>
        </div>
      </div>
    </div>
  )
}

