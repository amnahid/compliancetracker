$files = Get-ChildItem -Path "app\api" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace authResult.user.email with authResult.user?.email
    $content = $content -replace 'authResult\.user\.email', 'authResult.user?.email'
    
    # Replace authResult.user.role with authResult.user?.role
    $content = $content -replace 'authResult\.user\.role', 'authResult.user?.role'
    
    # Replace authResult.user.id with authResult.user?.id
    $content = $content -replace 'authResult\.user\.id', 'authResult.user?.id'
    
    Set-Content $file.FullName $content
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "All files processed!"
