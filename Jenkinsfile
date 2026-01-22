pipeline {
    agent any
    
    environment {
        // Docker registry
        REGISTRY = 'https://registry.yakninja.pro'
        REGISTRY_CREDENTIAL = 'yakninja-registry-credentials'
        
        // Image names
        SERVER_IMAGE = "registry.yakninja.pro/nibblelog-server"
        CLIENT_IMAGE = "registry.yakninja.pro/nibblelog-client"
        
        // Deployment server
        DEPLOY_HOST = '134.122.58.227'
        DEPLOY_USER = 'yakninja'
        DEPLOY_SSH_CREDENTIAL = 'yakninja-deploy-ssh-key'
        
        // Build configuration
        EXPO_PUBLIC_API_URL = 'https://nibbleapi.yakninja.pro'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.GIT_COMMIT_SHORT}-${env.BUILD_NUMBER}"
                }
            }
        }
        
        stage('Build Server Image') {
            steps {
                script {
                    dir('apps/server') {
                        docker.build("${SERVER_IMAGE}:${BUILD_TAG}")
                        docker.build("${SERVER_IMAGE}:latest")
                    }
                }
            }
        }
        
        stage('Build Client Image') {
            steps {
                script {
                    dir('apps/client') {
                        docker.build(
                            "${CLIENT_IMAGE}:${BUILD_TAG}",
                            "--build-arg EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL} ."
                        )
                        docker.build(
                            "${CLIENT_IMAGE}:latest",
                            "--build-arg EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL} ."
                        )
                    }
                }
            }
        }
        
        stage('Push Images to Registry') {
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY}", REGISTRY_CREDENTIAL) {
                        // Push server images
                        docker.image("${SERVER_IMAGE}:${BUILD_TAG}").push()
                        docker.image("${SERVER_IMAGE}:latest").push()
                        
                        // Push client images
                        docker.image("${CLIENT_IMAGE}:${BUILD_TAG}").push()
                        docker.image("${CLIENT_IMAGE}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                sshagent([DEPLOY_SSH_CREDENTIAL]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            cd /home/yakninja/nibblelog &&
                            docker-compose pull &&
                            docker-compose up -d &&
                            docker-compose ps
                        '
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    // Wait for services to be healthy
                    sleep(time: 10, unit: 'SECONDS')
                    
                    // Check API health
                    sh """
                        curl -f https://nibbleapi.yakninja.pro/health || exit 1
                    """
                    
                    // Check frontend is accessible
                    sh """
                        curl -f -I https://nibble.yakninja.pro || exit 1
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "Deployment successful! 🚀"
            echo "Frontend: https://nibble.yakninja.pro"
            echo "API: https://nibbleapi.yakninja.pro"
        }
        failure {
            echo "Deployment failed! ❌"
        }
        cleanup {
            // Clean up dangling images
            sh 'docker image prune -f || true'
        }
    }
}
